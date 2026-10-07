import { getApp, getMockupTypeLabel } from "./apps";

type SlackPayload = {
  text: string;
  blocks?: Array<Record<string, unknown>>;
};

export async function sendSlackNotification(payload: SlackPayload) {
  const settings = await import("./db").then((m) =>
    m.prisma.settings.findUnique({ where: { id: "default" } })
  );

  const webhookUrl = settings?.slackWebhookUrl;
  if (!webhookUrl) return { sent: false, reason: "no_webhook" };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { sent: res.ok, reason: res.ok ? "ok" : "failed" };
  } catch {
    return { sent: false, reason: "error" };
  }
}

export async function notifyApproval(opts: {
  appId: string;
  campaignTitle: string;
  campaignId: string;
  mockupType: string;
  version: number;
  approved: boolean;
  approverLabel?: string;
  fullyApproved?: boolean;
  baseUrl?: string;
}) {
  const app = getApp(opts.appId);
  const typeLabel = getMockupTypeLabel(opts.mockupType);
  const who = opts.approverLabel || "Reviewer";
  const action = opts.approved ? "approved" : "revoked approval";
  const signOff = opts.fullyApproved ? " · Fully signed off" : "";
  const base = opts.baseUrl || "http://localhost:3000";
  const link = `${base}/review/${opts.appId}/${opts.campaignId}`;

  return sendSlackNotification({
    text: `${app?.name} · ${opts.campaignTitle} · ${typeLabel} v${opts.version} — ${who} ${action}${signOff}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${app?.name}* · *${opts.campaignTitle}*\n${typeLabel} mockup v${opts.version} — *${who}* ${action}${signOff}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View campaign" },
            url: link,
          },
        ],
      },
    ],
  });
}

export async function notifyComment(opts: {
  appId: string;
  campaignTitle: string;
  campaignId: string;
  mockupType: string;
  version: number;
  comment: string;
  baseUrl?: string;
}) {
  const app = getApp(opts.appId);
  const typeLabel = getMockupTypeLabel(opts.mockupType);
  const base = opts.baseUrl || "http://localhost:3000";
  const link = `${base}/review/${opts.appId}/${opts.campaignId}`;

  return sendSlackNotification({
    text: `New comment on ${opts.campaignTitle}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${app?.name}* · *${opts.campaignTitle}*\n${typeLabel} v${opts.version} — new comment:\n>${opts.comment}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View campaign" },
            url: link,
          },
        ],
      },
    ],
  });
}
