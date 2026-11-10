import { HttpError } from "./validation";

/** Nama file -> "source" aman: huruf kecil, angka, titik, minus, garis bawah; berekstensi .pdf/.md. */
export function sourceFromFilename(filename: string): string {
  const lower = filename.trim().toLowerCase();
  const ext = lower.endsWith(".pdf") ? ".pdf" : lower.endsWith(".md") ? ".md" : null;
  if (!ext) throw new HttpError(400, "Pilih file PDF (.pdf) atau Markdown (.md).");
  const stem = lower.slice(0, -ext.length).replace(/\s+/g, "-").replace(/[^a-z0-9._-]/g, "").replace(/^[^a-z0-9]+/, "");
  if (!stem || stem.length > 76) throw new HttpError(400, `Gunakan nama file 1–76 karakter sebelum ${ext}, dengan huruf atau angka.`);
  return `${stem}${ext}`;
}
