import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const { campaignId, type, label, sortOrder } = body;

  if (!campaignId || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let nextSortOrder = sortOrder;
  if (nextSortOrder === undefined) {
    const last = await prisma.mockup.findFirst({
      where: { campaignId },
      orderBy: { sortOrder: "desc" },
    });
    nextSortOrder = (last?.sortOrder ?? -1) + 1;
  }

  const mockup = await prisma.mockup.create({
    data: {
      campaignId,
      type,
      label: typeof label === "string" ? label.trim() : "",
      sortOrder: nextSortOrder,
    },
  });

  return NextResponse.json(mockup);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, label } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const mockup = await prisma.mockup.update({
    where: { id },
    data: { label: typeof label === "string" ? label.trim() : "" },
  });

  return NextResponse.json(mockup);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await prisma.mockup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
