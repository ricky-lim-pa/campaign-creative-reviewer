import fs from "fs/promises";
import path from "path";

export function getUploadFiles(formData: FormData): File[] {
  const multiple = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (multiple.length > 0) return multiple;

  const single = formData.get("file");
  if (single instanceof File && single.size > 0) return [single];

  return [];
}

export async function saveMockupImage(
  file: File,
  mockupId: string,
  version: number
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const filename = `${mockupId}-v${version}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

export function mockupCopyFieldsFromForm(formData: FormData) {
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };

  return {
    subject: text("subject"),
    preheader: text("preheader"),
    bodyCopy: text("bodyCopy"),
    pushTitle: text("pushTitle"),
    pushBody: text("pushBody"),
    cta: text("cta"),
    notes: text("notes"),
  };
}
