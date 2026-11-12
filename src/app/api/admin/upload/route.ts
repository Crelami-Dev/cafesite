import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { localError, localJson } from "@/lib/server/local-api";
import { requireLocalAdmin } from "@/lib/server/local-session";
import { HttpError } from "@/lib/server/validation";
import {isCloudPrimaryEnv} from "@/lib/server/storage-mode";
import {cloudDb,checkCloud} from "@/lib/server/cloud-db";

const MAX_BYTES = 5 * 1024 * 1024;

/** Deteksi tipe dari isi file (bukan dari nama/Content-Type yang bisa dipalsukan). */
function detect(bytes: Uint8Array): "jpg" | "png" | "webp" | "avif" | null {
  const ascii = (from: number, to: number): string => String.fromCharCode(...bytes.subarray(from, to));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (ascii(1, 4) === "PNG" && bytes[0] === 0x89) return "png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (ascii(4, 8) === "ftyp" && /avif|avis/.test(ascii(8, 12))) return "avif";
  return null;
}

/** Mode lokal: foto menu disimpan di public/uploads/menu (diabaikan git), URL-nya langsung dipakai halaman publik. */
export async function POST(request: Request): Promise<Response> {
  try {
    const folder = new URL(request.url).searchParams.get("folder") === "gallery" ? "gallery" : "menu";
    await requireLocalAdmin(request, folder);
    const file = (await request.formData().catch(() => null))?.get("file");
    if (!(file instanceof File) || file.size === 0) throw new HttpError(400, "Pilih file foto.");
    if (file.size > MAX_BYTES) throw new HttpError(413, "Foto maksimal 5 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = detect(bytes);
    if (!ext) throw new HttpError(400, "Foto harus JPG, PNG, WebP, atau AVIF.");

    const maxWidth = folder === "gallery" ? 1400 : 900;
    const webpBuffer = await sharp(bytes)
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
