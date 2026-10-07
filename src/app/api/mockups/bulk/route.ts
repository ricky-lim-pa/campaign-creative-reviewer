import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { labelFromFilename } from "@/lib/mockups";
import { getUploadFiles, saveMockupImage } from "@/lib/uploads";

export async function POST(request: Request) {
  const formData = await request.formData();
  const campaignId = formData.get("campaignId") as string;
  const type = formData.get("type") as string;
  const files = getUploadFiles(formData);

  if (!campaignId || !type) {
    return NextResponse.json({ error: "Missing campaignId or type" }, { status: 400 });
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const last = await prisma.mockup.findFirst({
    where: { campaignId },
    orderBy: { sortOrder: "desc" },
  });
  let sortOrder = (last?.sortOrder ?? -1) + 1;

  const created = [];
  for (const file of files) {
    const label = labelFromFilename(file.name);
    const mockup = await prisma.mockup.create({
      data: {
        campaignId,
        type,
        label,
        sortOrder,
      },
    });
    sortOrder += 1;

    const imagePath = await saveMockupImage(file, mockup.id, 1);
    const version = await prisma.mockupVersion.create({
      data: {
        mockupId: mockup.id,
        version: 1,
        imagePath,
        approval: { create: { approved: false } },
      },
      include: { approval: true },
    });

    created.push({ mockup, version });
  }

  return NextResponse.json({ count: created.length, items: created });
}
