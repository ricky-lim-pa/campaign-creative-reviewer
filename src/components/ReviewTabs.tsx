import Link from "next/link";

const tabs = [
  { id: "review", label: "Campaign review", href: "/review" },
  { id: "calendar", label: "Touchpoint calendar", href: "/review/calendar" },
] as const;

export function ReviewTabs({ active }: { active: (typeof tabs)[number]["id"] }) {
  return (
    <nav aria-label="Reviewer navigation" className="mb-6 flex flex-wrap items-center gap-2">
      {tabs.map(({ id, label, href }) => (
        <Link key={id} href={href} aria-current={active === id ? "page" : undefined}
          className={active === id ? "hub-btn-primary" : "hub-btn"}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
