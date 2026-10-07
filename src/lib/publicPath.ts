export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalized}`;
}

export async function fetchCampaign(id: string) {
  const api = await fetch(withBasePath(`/api/campaigns/${id}`));
  if (api.ok) return api.json();

  const file = await fetch(withBasePath(`/data/campaigns/${id}.json`));
  if (!file.ok) return null;
  return file.json();
}

export async function fetchCampaignList(appId?: string) {
  const query = appId ? `?appId=${encodeURIComponent(appId)}` : "";
  const api = await fetch(withBasePath(`/api/campaigns${query}`));
  if (api.ok) return api.json();

  const file = await fetch(withBasePath("/data/campaigns.json"));
  if (!file.ok) throw new Error("Could not load campaigns");
  const rows = (await file.json()) as Array<{ appId: string }>;
  return appId ? rows.filter((row) => row.appId === appId) : rows;
}
