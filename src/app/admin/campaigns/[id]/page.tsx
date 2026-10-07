import AdminCampaignClient from "./admin-client";
import { adminCampaignParams } from "@/lib/staticParams";

export const dynamicParams = false;

export function generateStaticParams() {
  return adminCampaignParams();
}

export default function AdminCampaignPage() {
  return <AdminCampaignClient />;
}
