import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  labelFromFilename,
  legacyFieldsFromCopyBlocks,
  parseCopyBlocks,
  sanitizeCopyBlocks,
  serializeCopyBlocks,
  supportsMultipleAssets,
} from "@/lib/mockups";
import {
  getUploadFiles,
  mockupCopyFieldsFromForm,
  saveMockupImage,
} from "@/lib/uploads";

function copyBlocksFromForm(formData: FormData) {
  const raw = formData.get("copyBlocks");
  if (typeof raw === "string" && raw.trim()) {
    const parsed = sanitizeCopyBlocks(parseCopyBlocks(raw));
    if (parsed.length > 0) return parsed;
  }

  const legacy = mockupCopyFieldsFromForm(formData);
  const blocks = [
    legacy.subject ? { label: "Subject", value: legacy.subject } : null,
    legacy.preheader ? { label: "Preheader", value: legacy.preheader } : null,
    legacy.bodyCopy ? { label: "Body", value: legacy.bodyCopy } : null,
    legacy.pushTitle ? { label: "Title", value: legacy.pushTitle } : null,
    legacy.pushBody ? { label: "Body", value: legacy.pushBody } : null,
    legacy.cta ? { label: "CTA", value: legacy.cta } : null,
    legacy.notes ? { label: "Notes", value: legacy.notes } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return sanitizeCopyBlocks(blocks);
}

async function nextSortOrder(campaignId: string) {
  const last = await prisma.mockup.findFirst({
    where: { campaignId },
    orderBy: { sortOrder: "desc" },
  });
  return (last?.sortOrder ?? -1) + 1;
}

async function createVersionRecord(
  mockupId: string,
  version: number,
  imagePath: string | null,
  copyBlocks: ReturnType<typeof copyBlocksFromForm>
) {
  const legacyFields = legacyFieldsFromCopyBlocks(copyBlocks);
  return prisma.mockupVersion.create({
    data: {
      mockupId,
      version,
      imagePath,
      copyBlocks: serializeCopyBlocks(copyBlocks),
      ...legacyFields,
      approval: { create: { approved: false } },
    },
    include: { approval: true },
  });
}

async function createSeparateAssets(
  mockup: { id: string; campaignId: string; type: string; label: string },
  files: File[],
  copyBlocks: ReturnType<typeof copyBlocksFromForm>,
  hasExistingVersion: boolean
) {
  const created = [];
  let sortOrder = await nextSortOrder(mockup.campaignId);

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    let targetMockupId = mockup.id;
    const label = labelFromFilename(file.name);

    if (index === 0 && !hasExistingVersion) {
      if (!mockup.label?.trim()) {
        await prisma.mockup.update({
          where: { id: mockup.id },
          data: { label },
        });
      }
    } else {
      const sibling = await prisma.mockup.create({
        data: {
          campaignId: mockup.campaignId,
          type: mockup.type,
          label,
          sortOrder,
        },
      });
      sortOrder += 1;
      targetMockupId = sibling.id;
    }

    const imagePath = await saveMockupImage(file, targetMockupId, 1);
    const version = await createVersionRecord(targetMockupId, 1, imagePath, copyBlocks);
    created.push(version);
  }

  return created;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const mockupId = formData.get("mockupId") as string;

  if (!mockupId) {
    return NextResponse.json({ error: "Missing mockupId" }, { status: 400 });
  }

  const mockup = await prisma.mockup.findUnique({ where: { id: mockupId } });
  if (!mockup) {
    return NextResponse.json({ error: "Mockup not found" }, { status: 404 });
  }

  const latest = await prisma.mockupVersion.findFirst({
    where: { mockupId },
    orderBy: { version: "desc" },
  });

  let nextVersion = (latest?.version ?? 0) + 1;
  const copyBlocks = copyBlocksFromForm(formData);
  const files = getUploadFiles(formData);

  if (files.length === 0) {
    const imagePath = latest?.imagePath ?? null;
    const version = await createVersionRecord(mockupId, nextVersion, imagePath, copyBlocks);
    return NextResponse.json({ versions: [version], count: 1, mode: "version" });
  }

  if (files.length > 1 && supportsMultipleAssets(mockup.type)) {
    const versions = await createSeparateAssets(mockup, files, copyBlocks, Boolean(latest));
    return NextResponse.json({
      versions,
      count: versions.length,
      mode: "assets",
      assetsCreated: versions.length,
    });
  }

  const created = [];
  for (const file of files) {
    const imagePath = await saveMockupImage(file, mockupId, nextVersion);
    const version = await createVersionRecord(mockupId, nextVersion, imagePath, copyBlocks);
    created.push(version);
    nextVersion += 1;
  }

  return NextResponse.json({ versions: created, count: created.length, mode: "version" });
}
