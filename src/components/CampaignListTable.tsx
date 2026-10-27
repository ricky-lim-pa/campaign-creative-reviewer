"use client";

import { useRouter } from "next/navigation";
import { AppIcon } from "@/components/AppIcon";
import { formatDate, getApp } from "@/lib/apps";

export type CampaignListRow = {
  id: string;
  appId: string;
  title: string;
  region: string;
  startDate: string | Date;
  endDate: string | Date;
  approvedCount?: number;
  totalAssets?: number;
  fullyApproved?: boolean;
};

type CampaignListTableProps = {
  rows: CampaignListRow[];
  showApp?: boolean;
  linkLabel?: string;
  /** review-app: /review/{appId}/{id} · review-any: /review/{row.appId}/{id} · admin: /admin/campaigns/{id} */
  linkPattern: "review-app" | "review-any" | "admin";
  appId?: string;
  showReviewStatus?: boolean;
};

function hrefForRow(row: CampaignListRow, linkPattern: CampaignListTableProps["linkPattern"], appId?: string) {
  if (linkPattern === "review-app" && appId) return `/review/${appId}/${row.id}`;
  if (linkPattern === "review-any") return `/review/${row.appId}/${row.id}`;
  return `/admin/campaigns/${row.id}`;
}

function reviewLabel(row: CampaignListRow) {
  const assets = row.totalAssets ?? 0;
  if (assets === 0 && !row.fullyApproved) return "Assets Pending";
  return row.fullyApproved ? "Approved" : "Needs Review";
}

export function CampaignListTable({
  rows,
  showApp = true,
  linkLabel = "Review",
  linkPattern,
  appId,
  showReviewStatus = false,
}: CampaignListTableProps) {
  const router = useRouter();

  function canOpen(row: CampaignListRow) {
    if (!showReviewStatus) return true;
    return (row.totalAssets ?? 0) > 0;
  }

  function openRow(row: CampaignListRow) {
    if (!canOpen(row)) return;
    router.push(hrefForRow(row, linkPattern, appId));
  }

  return (
    <div className="hub-table-wrap overflow-x-auto">
      <table className="hub-table">
        <thead>
          <tr>
            <th>Start</th>
            <th>End</th>
            <th>Region</th>
            <th>Campaign</th>
            {showApp ? <th>App</th> : null}
            {showReviewStatus ? <th className="hub-table__status">Status</th> : null}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const app = getApp(row.appId);
            const open = canOpen(row);
            const label = reviewLabel(row);
            return (
              <tr
                key={row.id}
                className={open ? "hub-table__row hub-table__row--clickable" : "hub-table__row"}
                onClick={() => openRow(row)}
                onKeyDown={(event) => {
                  if (!open) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openRow(row);
                  }
                }}
                tabIndex={open ? 0 : undefined}
                role={open ? "link" : undefined}
                aria-label={open ? `Open ${row.title} for review` : undefined}
              >
                <td className="hub-table__date">{formatDate(row.startDate)}</td>
                <td className="hub-table__date">{formatDate(row.endDate)}</td>
                <td className="hub-table__region">{row.region || "—"}</td>
                <td className="hub-table__title">{row.title}</td>
                {showApp ? (
                  <td>
                    <div className="flex items-center gap-2 font-medium">
                      <AppIcon appId={row.appId} size={22} className="rounded-lg" />
                      <span>{app?.shortName}</span>
                    </div>
                  </td>
                ) : null}
                {showReviewStatus ? (
                  <td className="hub-table__status whitespace-nowrap">
                    <span className={label === "Approved" ? "hub-tag hub-tag--approved" : "hub-tag hub-tag--review"}>
                      {label}
                    </span>
                  </td>
                ) : null}
                <td className="whitespace-nowrap text-right">
                  {open ? <span className="hub-table-link">{linkLabel} →</span> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
