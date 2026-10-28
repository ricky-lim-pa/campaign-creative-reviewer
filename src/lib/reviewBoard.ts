import { withBasePath } from "@/lib/publicPath";
import type { ApprovalRecord, ApproverId } from "@/lib/approvals";

const BOARD_URL = "https://crudcrud.com/api/b54a83a873d24d88aa850499c08b506b";

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

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Could not load shared review (${response.status})`);
  return response.json() as Promise<T>;
}

async function loadSnapshot(): Promise<ReviewBoard> {
  const response = await fetch(withBasePath("/data/review-board.json"), { cache: "no-store" });
  if (!response.ok) return emptyBoard();
  const body = (await response.json()) as { approvals?: ApprovalDoc[]; comments?: CommentDoc[] };
  return indexBoard(body.approvals ?? [], body.comments ?? [], false);
}

export function invalidateReviewBoard() {
  cached = null;
}

export async function loadReviewBoard(force = false): Promise<ReviewBoard> {
  if (!force && cached && Date.now() - cached.at < 3000) return cached.board;
  if (!force && inflight) return inflight;

  inflight = (async () => {
    try {
      const [approvals, comments] = await Promise.all([
        readJson<ApprovalDoc[]>(`${BOARD_URL}/approvals`),
        readJson<CommentDoc[]>(`${BOARD_URL}/comments`),
      ]);
      const board = indexBoard(approvals, comments, true);
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

async function writeApproval(existingId: string | undefined, payload: Omit<ApprovalDoc, "_id">) {
  if (!existingId) {
    const response = await fetch(`${BOARD_URL}/approvals`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Could not save approval.");
    return (await response.json()) as ApprovalDoc;
  }

  const response = await fetch(`${BOARD_URL}/approvals/${existingId}`, {
    method: "PUT",
    cache: "no-store",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Could not save approval.");
  return { _id: existingId, ...payload };
}

export async function setApprover(
  versionId: string,
  approver: ApproverId,
  signed: boolean
): Promise<ApprovalRecord> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const docs = await readJson<ApprovalDoc[]>(`${BOARD_URL}/approvals`);
      const existing = docs.find((doc) => doc.versionId === versionId);
      const now = new Date().toISOString();
      const rogerApproved = approver === "roger" ? signed : Boolean(existing?.rogerApproved);
      const toddApproved = approver === "todd" ? signed : Boolean(existing?.toddApproved);
      const approved = rogerApproved && toddApproved;
      const payload = {
        versionId,
        rogerApproved,
        rogerApprovedAt: approver === "roger" ? (signed ? now : null) : (existing?.rogerApprovedAt ?? null),
        toddApproved,
        toddApprovedAt: approver === "todd" ? (signed ? now : null) : (existing?.toddApprovedAt ?? null),
        approved,
        approvedAt: approved ? (existing?.approvedAt && existing.approved ? existing.approvedAt : now) : null,
      };
      await writeApproval(existing?._id, payload);

      const fresh = (await readJson<ApprovalDoc[]>(`${BOARD_URL}/approvals`)).find(
        (doc) => doc.versionId === versionId
      );
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
  const response = await fetch(`${BOARD_URL}/comments`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      versionId,
      text: text.trim(),
      author,
      createdAt: new Date().toISOString(),
    }),
  });
  if (!response.ok) throw new Error("Could not post comment.");
  const created = (await response.json()) as CommentDoc;
  invalidateReviewBoard();
  return {
    id: created._id,
    text: created.text,
    author: created.author || "Executive",
    createdAt: created.createdAt,
  };
}
