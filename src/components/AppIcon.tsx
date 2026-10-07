import Image from "next/image";
import { getApp } from "@/lib/apps";

type AppIconProps = {
  appId: string;
  size?: number;
  className?: string;
};

export function AppIcon({ appId, size = 40, className = "" }: AppIconProps) {
  const app = getApp(appId);
  if (!app) return null;

  return (
    <Image
      src={app.iconUrl}
      alt={`${app.shortName} icon`}
      width={size}
      height={size}
      className={`rounded-xl bg-white object-contain ${className}`}
      unoptimized
    />
  );
}
