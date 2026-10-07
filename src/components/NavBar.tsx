"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
  active?: boolean;
};

function isNavActive(href: string, pathname: string) {
  if (href === "/review") return pathname === "/review";
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavBar({
  links,
  badge,
}: {
  links: NavLink[];
  badge?: string;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-hub-border/80 bg-white/90 shadow-[0_1px_0_rgba(84,83,83,0.06)] backdrop-blur-md">
      <div className="hub-container flex items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/review"
            className="text-base font-semibold tracking-humaan-tight text-hub-ink md:text-lg"
          >
            Campaign Creative Review
          </Link>
          {badge && <span className="hub-badge">{badge}</span>}
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          {links.map((link) => {
            const active = link.active ?? isNavActive(link.href, pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`hub-nav-link ${active ? "hub-nav-link-active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export const reviewNav = [
  { href: "/review", label: "Apps" },
  { href: "/review/calendar", label: "Calendar" },
];

export const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/campaigns/new", label: "New campaign" },
  { href: "/admin/settings", label: "Settings" },
];
