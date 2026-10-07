import { APPS } from "@/lib/apps";
import { prisma } from "@/lib/db";

export function appStaticParams() {
  return APPS.map((app) => ({ app: app.id }));
}

export async function campaignStaticParams() {
  const campaigns = await prisma.campaign.findMany({
    select: { id: true, appId: true },
  });
  return campaigns.map((campaign) => ({
    app: campaign.appId,
    campaignId: campaign.id,
  }));
}

export async function adminCampaignParams() {
  const campaigns = await prisma.campaign.findMany({
    select: { id: true },
  });
  return campaigns.map((campaign) => ({ id: campaign.id }));
}
