import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const base = "https://crudcrud.com/api/b54a83a873d24d88aa850499c08b506b";
const file = path.join(process.cwd(), "src", "data", "review-board.json");

async function list(resource) {
  const response = await fetch(`${base}/${resource}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`list ${resource} ${response.status}`);
  return response.json();
}

async function readSnapshot() {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return { approvals: [], comments: [] };
  }
}

async function restore(resource, docs) {
  for (const doc of docs) {
    const { _id, ...payload } = doc;
    const response = await fetch(`${base}/${resource}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`restore ${resource} ${response.status}`);
  }
}

const saved = await readSnapshot();
const liveApprovals = await list("approvals");
const liveComments = await list("comments");

if (liveApprovals.length === 0 && saved.approvals?.length) {
  await restore("approvals", saved.approvals);
  await restore("comments", saved.comments ?? []);
  console.log("Restored shared review board from the saved copy.");
}

const snapshot = {
  approvals: await list("approvals"),
  comments: await list("comments"),
};
await mkdir(path.dirname(file), { recursive: true });
await writeFile(file, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Saved ${snapshot.approvals.length} approvals and ${snapshot.comments.length} comments.`);
