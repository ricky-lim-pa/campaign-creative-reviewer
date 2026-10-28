import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

process.env.DATABASE_URL = "file:C:/Users/ricky/.cursor/projects/fp-campaign-hub/prisma/dev.db";

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();
const base = "https://crudcrud.com/api/b54a83a873d24d88aa850499c08b506b";

async function list(resource) {
  const response = await fetch(`${base}/${resource}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`list ${resource} ${response.status}`);
  return response.json();
}

async function remove(resource, id) {
  const response = await fetch(`${base}/${resource}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`delete ${resource} ${response.status}`);
}

const approvals = await prisma.approval.findMany();
const comments = await prisma.comment.findMany({ orderBy: { createdAt: "asc" } });

for (const doc of await list("approvals")) {
  if (doc.versionId === "probe") await remove("approvals", doc._id);
}
for (const doc of await list("comments")) {
  if (doc.versionId === "probe") await remove("comments", doc._id);
}

const existingApprovals = await list("approvals");
const haveApproval = new Set(existingApprovals.map((doc) => doc.versionId));

for (const approval of approvals) {
  if (haveApproval.has(approval.mockupVersionId)) continue;
  const response = await fetch(`${base}/approvals`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      versionId: approval.mockupVersionId,
      rogerApproved: approval.rogerApproved,
      rogerApprovedAt: approval.rogerApprovedAt?.toISOString() ?? null,
      toddApproved: approval.toddApproved,
      toddApprovedAt: approval.toddApprovedAt?.toISOString() ?? null,
      approved: approval.approved,
      approvedAt: approval.approvedAt?.toISOString() ?? null,
    }),
  });
  if (!response.ok) throw new Error(`approval ${approval.mockupVersionId} ${response.status}`);
}

const existingComments = await list("comments");
const haveComment = new Set(existingComments.map((doc) => doc.sourceId).filter(Boolean));

for (const comment of comments) {
  if (haveComment.has(comment.id)) continue;
  const response = await fetch(`${base}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      versionId: comment.mockupVersionId,
      sourceId: comment.id,
      text: comment.text,
      author: comment.author,
      createdAt: comment.createdAt.toISOString(),
    }),
  });
  if (!response.ok) throw new Error(`comment ${comment.id} ${response.status}`);
}

const snapshot = {
  approvals: await list("approvals"),
  comments: await list("comments"),
};
const file = path.join(process.cwd(), "src", "data", "review-board.json");
await mkdir(path.dirname(file), { recursive: true });
await writeFile(file, JSON.stringify(snapshot));
console.log(`approvals ${snapshot.approvals.length} comments ${snapshot.comments.length}`);
await prisma.$disconnect();
