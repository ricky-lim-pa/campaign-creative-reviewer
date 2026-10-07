import { rename, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const dynamicPages = [
  "src/app/review/page.tsx",
  "src/app/review/calendar/page.tsx",
  "src/app/admin/page.tsx",
];

for (const file of dynamicPages) {
  const text = await readFile(file, "utf8");
  const next = text.replace(
    'export const dynamic = "force-dynamic";',
    'export const dynamic = "force-static";'
  );
  if (next === text) {
    throw new Error(`Could not mark ${file} as static`);
  }
  await writeFile(file, next);
}

if (existsSync("src/app/api") && !existsSync("src/app/_api_hold")) {
  await rename("src/app/api", "src/app/_api_hold");
}

console.log("Prepared the project for a static GitHub Pages export.");
