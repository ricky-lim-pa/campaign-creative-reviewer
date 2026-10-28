import { appStaticParams } from "@/lib/staticParams";
import { RedirectHome } from "@/components/RedirectHome";

export const dynamicParams = false;

export function generateStaticParams() {
  return appStaticParams();
}

export default function AppCampaignsRedirect() {
  return <RedirectHome />;
}
