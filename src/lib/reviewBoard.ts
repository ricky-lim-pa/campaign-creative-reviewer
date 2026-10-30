import store from "@/data/review-board-store.json";
import { withBasePath } from "@/lib/publicPath";
import type { ApprovalRecord, ApproverId } from "@/lib/approvals";

export type ReviewComment = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
};

type ApprovalDoc = {
  _id: string;
  versionId: string;
  rogerApproved: boolean;
  rogerApprovedAt?: string | null;
  toddApproved: boolean;
  toddApprovedAt?: string | null;
  approved: boolean;
  approvedAt?: string | null;
};

type CommentDoc = {
  _id: string;
  versionId: string;
  text: string;
  author: string;
  createdAt: string;
};

type BoardDoc = {
  approvals: ApprovalDoc[];
  comments: CommentDoc[];
};

export type ReviewBoard = {
  ok: boolean;
  live: boolean;
  approvals: Record<string, ApprovalRecord>;
  comments: Record<string, ReviewComment[]>;
};

type CampaignLike = {
  mockups: Array<{
    versions: Array<{
      id: string;
      approval: ApprovalRecord | null;
      comments: ReviewComment[];
    }>;
  }>;
};

const emptyBoard = (): ReviewBoard => ({
  ok: false,
  live: false,
  approvals: {},
  comments: {},
});

let cached: { at: number; board: ReviewBoard } | null = null;
let inflight: Promise<ReviewBoard> | null = null;

function asRecord(doc: ApprovalDoc): ApprovalRecord {
  const rogerApproved = Boolean(doc.rogerApproved);
  const toddApproved = Boolean(doc.toddApproved);
  const approved = rogerApproved && toddApproved;
  return {
    rogerApproved,
    rogerApprovedAt: doc.rogerApprovedAt ?? null,
    toddApproved,
    toddApprovedAt: doc.toddApprovedAt ?? null,
    approved,
    approvedAt: approved ? (doc.approvedAt ?? null) : null,
  };
}

function indexBoard(approvals: ApprovalDoc[], comments: CommentDoc[], live: boolean): ReviewBoard {
  const approvalMap: Record<string, ApprovalRecord> = {};
  for (const doc of approvals) {
    if (!doc.versionId || doc.versionId === "probe") continue;
    approvalMap[doc.versionId] = asRecord(doc);
  }

  const commentMap: Record<string, ReviewComment[]> = {};
  const sorted = [...comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const doc of sorted) {
    if (!doc.versionId || doc.versionId === "probe") continue;
    const list = commentMap[doc.versionId] ?? [];
    list.push({
      id: doc._id,
      text: doc.text,
      author: doc.author || "Executive",
      createdAt: doc.createdAt,
    });
    commentMap[doc.versionId] = list;
  }

  return { ok: true, live, approvals: approvalMap, comments: commentMap };
}

function normalize(body: Partial<BoardDoc> | null | undefined): BoardDoc {
  return {
    approvals: Array.isArray(body?.approvals) ? body.approvals : [],
    comments: Array.isArray(body?.comments) ? body.comments : [],
  };
}

async function loadDoc(): Promise<BoardDoc> {
  const response = await fetch(store.url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Could not load shared review (${response.status})`);
  return normalize((await response.json()) as Partial<BoardDoc>);
}

async function saveDoc(doc: BoardDoc, failure: string) {
  const response = await fetch(store.url, {
    method: "PUT",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Owner-Token": store.token,
    },
    body: JSON.stringify(normalize(doc)),
  });
  if (!response.ok) throw new Error(failure);
}

async function loadSnapshot(): Promise<ReviewBoard> {
  const response = await fetch(withBasePath("/data/review-board.json"), { cache: "no-store" });
  if (!response.ok) return emptyBoard();
  const body = normalize((await response.json()) as Partial<BoardDoc>);
  return indexBoard(body.approvals, body.comments, false);
}

export function invalidateReviewBoard() {
  cached = null;
}

export async function loadReviewBoard(force = false): Promise<ReviewBoard> {
  if (!force && cached && Date.now() - cached.at < 3000) return cached.board;
  if (!force && inflight) return inflight;

  inflight = (async () => {
    try {
      const doc = await loadDoc();
      const board = indexBoard(doc.approvals, doc.comments, true);
      cached = { at: Date.now(), board };
      return board;
    } catch {
      try {
        const board = await loadSnapshot();
        cached = { at: Date.now(), board };
        return board;
      } catch {
        const board = emptyBoard();
        cached = { at: Date.now(), board };
        return board;
      }
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function mergeCampaignReview<T extends CampaignLike>(campaign: T, board: ReviewBoard | null): T {
  if (!board?.ok) return campaign;
  return {
    ...campaign,
    mockups: campaign.mockups.map((mockup) => ({
      ...mockup,
      versions: mockup.versions.map((version) => ({
        ...version,
        approval: board.approvals[version.id] ?? null,
        comments: board.comments[version.id] ?? [],
      })),
    })),
  };
}

export function liveCampaignApproved(versionIds: string[], board: ReviewBoard | null, fallback: boolean) {
  if (!board?.ok || versionIds.length === 0) return fallback;
  return versionIds.every((id) => {
    const approval = board.approvals[id];
    return Boolean(approval?.rogerApproved && approval?.toddApproved);
  });
}

export async function setApprover(
  versionId: string,
  approver: ApproverId,
  signed: boolean
): Promise<ApprovalRecord> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const doc = await loadDoc();
      const existing = doc.approvals.find((item) => item.versionId === versionId);
      const now = new Date().toISOString();
      const rogerApproved = approver === "roger" ? signed : Boolean(existing?.rogerApproved);
      const toddApproved = approver === "todd" ? signed : Boolean(existing?.toddApproved);
      const approved = rogerApproved && toddApproved;
      const payload: ApprovalDoc = {
        _id: existing?._id || crypto.randomUUID(),
        versionId,
        rogerApproved,
        rogerApprovedAt: approver === "roger" ? (signed ? now : null) : (existing?.rogerApprovedAt ?? null),
        toddApproved,
        toddApprovedAt: approver === "todd" ? (signed ? now : null) : (existing?.toddApprovedAt ?? null),
        approved,
        approvedAt: approved ? (existing?.approved && existing.approvedAt ? existing.approvedAt : now) : null,
      };
      const approvals = existing
        ? doc.approvals.map((item) => (item.versionId === versionId ? payload : item))
        : [...doc.approvals, payload];
      await saveDoc({ approvals, comments: doc.comments }, "Could not save approval.");

      const fresh = (await loadDoc()).approvals.find((item) => item.versionId === versionId);
      const otherMatches =
        approver === "roger"
          ? Boolean(fresh?.toddApproved) === toddApproved
          : Boolean(fresh?.rogerApproved) === rogerApproved;
      const selfMatches =
        approver === "roger" ? Boolean(fresh?.rogerApproved) === signed : Boolean(fresh?.toddApproved) === signed;
      if (fresh && otherMatches && selfMatches) {
        invalidateReviewBoard();
        return asRecord(fresh);
      }
      lastError = new Error("Could not save approval.");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Could not save approval.");
    }
  }

  throw lastError ?? new Error("Could not save approval.");
}

export async function addComment(versionId: string, text: string, author = "Executive"): Promise<ReviewComment> {
  const trimmed = text.trim();
  const doc = await loadDoc();
  const created: CommentDoc = {
    _id: crypto.randomUUID(),
    versionId,
    text: trimmed,
    author,
    createdAt: new Date().toISOString(),
  };
  await saveDoc(
    { approvals: doc.approvals, comments: [...doc.comments, created] },
    "Could not post comment."
  );
  invalidateReviewBoard();
  return {
    id: created._id,
    text: created.text,
    author: created.author || "Executive",
    createdAt: created.createdAt,
  };
}
