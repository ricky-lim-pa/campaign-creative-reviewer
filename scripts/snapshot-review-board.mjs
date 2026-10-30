import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const storePath = path.join(process.cwd(), "src", "data", "review-board-store.json");
const file = path.join(process.cwd(), "src", "data", "review-board.json");
const headers = { Accept: "application/json", "User-Agent": "fp-campaign-hub-review-board" };

function boardFrom(body) {
  return {
    approvals: Array.isArray(body?.approvals) ? body.approvals : [],
    comments: Array.isArray(body?.comments) ? body.comments : [],
  };
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function openBoard(payload) {
  const response = await fetch("https://brewpage.app/api/json?ns=public&ttl=30", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`open ${response.status}`);
  const created = await response.json();
  const next = {
    url: `https://brewpage.app/api/json/public/${created.id}`,
    token: created.ownerToken,
    expiresAt: created.expiresAt,
  };
  await writeFile(storePath, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`Opened a new shared board through ${created.expiresAt}.`);
  return next;
}

async function main() {
  const store = await readJson(storePath, null);
  const saved = boardFrom(await readJson(file, { approvals: [], comments: [] }));
  if (!store?.url || !store?.token) {
    await openBoard(saved);
    return;
  }

  let response;
  try {
    response = await fetch(store.url, { headers });
  } catch (error) {
    console.log(`Shared board was not reachable. Kept the saved copy. ${error.message}`);
    return;
  }

  if (response.status === 404 || response.status === 410) {
    await openBoard(saved);
    return;
  }
  if (!response.ok) {
    console.log(`Shared board returned ${response.status}. Kept the saved copy.`);
    return;
  }

  let live = boardFrom(await response.json());
  if (live.approvals.length === 0 && saved.approvals.length > 0) {
    const restored = await fetch(store.url, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json", "X-Owner-Token": store.token },
      body: JSON.stringify(saved),
    });
    if (!restored.ok) {
      console.log(`Could not restore the shared board (${restored.status}). Kept the saved copy.`);
      return;
    }
    live = saved;
    console.log("Restored the shared board from the saved copy.");
  }

  const expiresAt = Date.parse(store.expiresAt || "");
  const renewBy = Date.now() + 3 * 24 * 60 * 60 * 1000;
  if (!Number.isFinite(expiresAt) || expiresAt < renewBy) {
    await openBoard(live);
  }

  await writeFile(file, `${JSON.stringify(live, null, 2)}\n`);
  console.log(`Saved ${live.approvals.length} approvals and ${live.comments.length} comments.`);
}

try {
  await main();
} catch (error) {
  console.log(`Shared board backup skipped. ${error.message}`);
}
