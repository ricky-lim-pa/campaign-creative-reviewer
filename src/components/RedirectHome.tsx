"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RedirectHome() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/review");
  }, [router]);

  return <p className="p-8 text-sm text-hub-muted">Loading campaigns...</p>;
}
