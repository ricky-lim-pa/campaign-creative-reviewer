"use client";

import { useRouter } from "next/navigation";

type BackLinkProps = {
  fallback: string;
  label: string;
  className?: string;
  onNavigate?: () => boolean;
};

export function goBackWithFallback(router: ReturnType<typeof useRouter>, fallback: string) {
  if (typeof window !== "undefined" && window.history.length > 1) {
    router.back();
    return;
  }

  router.push(fallback);
}

export function BackLink({ fallback, label, className, onNavigate }: BackLinkProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (onNavigate?.()) return;
        goBackWithFallback(router, fallback);
      }}
      className={className}
    >
      {label}
    </button>
  );
}
