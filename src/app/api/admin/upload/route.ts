import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { localError, localJson } from "@/lib/server/local-api";
import { requireLocalAdmin } from "@/lib/server/local-session";
import { HttpError } from "@/lib/server/validation";
import {isCloudPrimaryEnv} from "@/lib/server/storage-mode";
import {cloudDb,checkCloud} from "@/lib/server/cloud-db";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_SHARP_FORMATS = new Set([
  "jpeg",
  "png",
  "webp",
  "avif",
  "heif",
  "gif",
  "tiff",
  "svg",
]);

/** Mode lokal & cloud: setiap format gambar dikonversi wajib menjadi .webp via sharp sebelum disimpan ke storage / Supabase. */
export async function POST(request: Request): Promise<Response> {
  try {
    const folder = new URL(request.url).searchParams.get("folder") === "gallery" ? "gallery" : "menu";
    await requireLocalAdmin(request, folder);
    const file = (await request.formData().catch(() => null))?.get("file");
    if (!(file instanceof File) || file.size === 0) throw new HttpError(400, "Pilih file foto.");
    if (file.size > MAX_BYTES) throw new HttpError(413, "Foto maksimal 15 MB.");

    const bytes = Buffer.from(await file.arrayBuffer());
    const pipeline = sharp(bytes, {
      limitInputPixels: 100_000_000,
      sequentialRead: true,
    });

    let meta;
    try {
      meta = await pipeline.metadata();
    } catch {
      throw new HttpError(400, "File harus berupa gambar yang valid.");
    }
    if (!meta.format || !ALLOWED_SHARP_FORMATS.has(meta.format)) {
      throw new HttpError(400, "Format gambar tidak didukung.");
    }

    const maxWidth = folder === "gallery" ? 1400 : 900;
    const webpBuffer = await sharp(bytes, {
      limitInputPixels: 100_000_000,
      sequentialRead: true,
    })
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    const name = `${randomUUID()}.webp`;
    if(isCloudPrimaryEnv()) {
      const db=cloudDb(); const objectPath=`${folder}/${name}`;
      const result=await db.storage.from("cafe-assets").upload(objectPath,webpBuffer,{contentType:"image/webp",upsert:false});
      checkCloud(result.error);
      return localJson({url:db.storage.from("cafe-assets").getPublicUrl(objectPath).data.publicUrl},201);
    }
    const dir = path.join(process.cwd(), ".data", "uploads", folder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), webpBuffer);
    return localJson({ url: `/api/media/${folder}/${name}` }, 201);
  } catch (error) { return localError(error); }
}
