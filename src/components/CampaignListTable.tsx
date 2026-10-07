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

export function CampaignListTable({
  rows,
  showApp = true,
  linkLabel = "Review",
  linkPattern,
  appId,
  showReviewStatus = false,
}: CampaignListTableProps) {
  const router = useRouter();

  function openRow(row: CampaignListRow) {
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
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const app = getApp(row.appId);
            return (
              <tr
                key={row.id}
                className="hub-table__row hub-table__row--clickable"
                onClick={() => openRow(row)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openRow(row);
                  }
                }}
                tabIndex={0}
                role="link"
                aria-label={`Open ${row.title} for review`}
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
                <td className="text-right">
                  {showReviewStatus && row.fullyApproved ? (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="hub-tag hub-tag--approved">Approved</span>
                      <span className="hub-table-link">Review again →</span>
                    </div>
                  ) : (
                    <span className="hub-table-link">{linkLabel} →</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
