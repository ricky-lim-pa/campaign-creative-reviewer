import { NextResponse } from "next/server";
import { prisma, ensureSettings } from "@/lib/db";

export async function GET() {
  await ensureSettings();
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  await ensureSettings();
  const body = await request.json();
  const { slackWebhookUrl, reviewBaseUrl } = body;

  const settings = await prisma.settings.update({
    where: { id: "default" },
    data: {
      ...(slackWebhookUrl !== undefined && { slackWebhookUrl }),
      ...(reviewBaseUrl !== undefined && { reviewBaseUrl }),
    },
  });

  return NextResponse.json(settings);
}
