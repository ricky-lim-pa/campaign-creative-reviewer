import KpiClient from "./kpi-client";
import { campaignStaticParams } from "@/lib/staticParams";

export const dynamicParams = false;

export function generateStaticParams() {
  return campaignStaticParams();
}

export default function CampaignKpiPage() {
  return <KpiClient />;
}
