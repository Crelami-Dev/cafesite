import "server-only";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { GalleryPhoto } from "@/types";
export async function uniqueGalleryPhotos(
  photos: GalleryPhoto[],
): Promise<GalleryPhoto[]> {
  const seen = new Set<string>();
  const result: GalleryPhoto[] = [];
  for (const photo of photos) {
    if (!photo.src) continue;
    let key = photo.src;
    if (photo.src.startsWith("/Image/") && !photo.src.includes("..")) {
      try {
        key = createHash("sha256")
          .update(await readFile(path.join(process.cwd(), "public", photo.src)))
          .digest("hex");
      } catch {
        continue;
      }
    }
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(photo);
  }
  return result;
}
