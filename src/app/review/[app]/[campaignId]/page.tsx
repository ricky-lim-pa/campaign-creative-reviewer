import ReviewClient from "./review-client";
import { campaignStaticParams } from "@/lib/staticParams";

export const dynamicParams = false;

export function generateStaticParams() {
  return campaignStaticParams();
}

export default function CampaignReviewPage() {
  return <ReviewClient />;
}
