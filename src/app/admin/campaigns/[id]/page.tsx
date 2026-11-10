import AdminCampaignClient from "./admin-client";
import { LocalAdminNotice } from "@/components/LocalAdminNotice";
import { basePath } from "@/lib/publicPath";
import { adminCampaignParams } from "@/lib/staticParams";

export const dynamicParams = false;

export function generateStaticParams() {
  return adminCampaignParams();
}

export default async function AdminCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  if (basePath) {
    const { id } = await params;
    return <LocalAdminNotice campaignId={id} />;
  }

  return <AdminCampaignClient />;
}
