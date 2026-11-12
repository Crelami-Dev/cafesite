import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { DatabaseSync } from "node:sqlite";
import { createClient } from "@supabase/supabase-js";

const FOLDERS = [
  { name: "hero", maxWidth: 1600, quality: 82 },
  { name: "Gallery", maxWidth: 1400, quality: 80 },
  { name: "Menu", maxWidth: 800, quality: 80 },
];

const SOURCE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".avif", ".tiff", ".tif", ".heic", ".heif"]);
const rootDir = process.cwd();

function toWebpUrl(url, urlMap) {
  if (typeof url !== "string") return url;
  if (urlMap.has(url)) return urlMap.get(url);
  if (url.startsWith("/Image/")) {
    return url.replace(/\.(jpe?g|png|gif|avif|tiff?|heic|heif)$/i, ".webp");
  }
  return url;
}

function replaceUrlsDeep(value, urlMap) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(value);
        const replaced = replaceUrlsDeep(parsed, urlMap);
        const nextStr = JSON.stringify(replaced);
        return nextStr !== JSON.stringify(parsed) ? nextStr : value;
      } catch {
        // Bukan JSON valid; lanjut ke penggantian URL biasa
      }
    }
    return toWebpUrl(value, urlMap);
  }
  if (Array.isArray(value)) return value.map((item) => replaceUrlsDeep(item, urlMap));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = replaceUrlsDeep(v, urlMap);
    }
    return out;
  }
  return value;
}

async function convertStaticFolder(folder, maxWidth, quality) {
  const dir = path.join(rootDir, "public", "Image", folder);
  if (!fs.existsSync(dir)) return { beforeBytes: 0, afterBytes: 0, converted: 0, deleted: 0 };
  const files = fs.readdirSync(dir);

  let beforeBytes = 0;
  let afterBytes = 0;
  let converted = 0;
  let deleted = 0;

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (!fs.statSync(fullPath).isFile()) continue;
    const ext = path.extname(file).toLowerCase();
    if (ext === ".webp") {
      afterBytes += fs.statSync(fullPath).size;
      continue;
    }
    if (!SOURCE_EXTS.has(ext)) continue;

    const base = path.basename(file, path.extname(file));
    const webpPath = path.join(dir, `${base}.webp`);
    const srcSize = fs.statSync(fullPath).size;
    beforeBytes += srcSize;

    await sharp(fullPath)
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality, effort: 5 })
      .toFile(webpPath);

    const webpSize = fs.statSync(webpPath).size;
    if (webpSize <= 0) throw new Error(`Hasil WebP kosong untuk ${fullPath}`);
    afterBytes += webpSize;
    converted += 1;

    fs.unlinkSync(fullPath);
    deleted += 1;
    console.log(`✓ Image/${folder}/${file} (${Math.round(srcSize / 1024)} KB) -> ${base}.webp (${Math.round(webpSize / 1024)} KB)`);
  }

  return { beforeBytes, afterBytes, converted, deleted };
}

async function convertLocalUploads(urlMap) {
  let converted = 0;
  for (const folder of ["menu", "gallery"]) {
    const dir = path.join(rootDir, ".data", "uploads", folder);
    if (!fs.existsSync(dir)) continue;
    const maxWidth = folder === "gallery" ? 1400 : 900;

    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file);
      if (!fs.statSync(fullPath).isFile()) continue;
      const ext = path.extname(file).toLowerCase();
      if (ext === ".webp" || !SOURCE_EXTS.has(ext)) continue;

      const base = path.basename(file, path.extname(file));
      const webpName = `${base}.webp`;
      const webpPath = path.join(dir, webpName);

      await sharp(fullPath)
        .rotate()
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toFile(webpPath);

      if (fs.statSync(webpPath).size > 0) {
        fs.unlinkSync(fullPath);
        urlMap.set(`/api/media/${folder}/${file}`, `/api/media/${folder}/${webpName}`);
        converted += 1;
        console.log(`✓ .data/uploads/${folder}/${file} -> ${webpName}`);
      }
    }
  }
  return converted;
}

function updateSqliteDb(dbFile, urlMap) {
  const dbPath = path.join(rootDir, dbFile);
  if (!fs.existsSync(dbPath)) return 0;

  const db = new DatabaseSync(dbPath);
  let updatedCount = 0;

  db.exec("BEGIN IMMEDIATE");
  try {
    const menuRows = db.prepare("SELECT id, data FROM menu_items").all();
    const updateMenu = db.prepare("UPDATE menu_items SET data = ? WHERE id = ?");
    for (const row of menuRows) {
      const data = JSON.parse(row.data);
      const next = replaceUrlsDeep(data, urlMap);
      const nextJson = JSON.stringify(next);
      if (nextJson !== JSON.stringify(data)) {
        updateMenu.run(nextJson, row.id);
        updatedCount += 1;
      }
    }

    const contentRows = db.prepare("SELECT key, data FROM content").all();
    const updateContent = db.prepare("UPDATE content SET data = ? WHERE key = ?");
    for (const row of contentRows) {
      const data = JSON.parse(row.data);
      const next = replaceUrlsDeep(data, urlMap);
      const nextJson = JSON.stringify(next);
      if (nextJson !== JSON.stringify(data)) {
        updateContent.run(nextJson, row.key);
        updatedCount += 1;
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  } finally {
    db.close();
  }
  return updatedCount;
}

async function listBucketObjects(sb, prefix = "") {
  const out = [];
  const { data, error } = await sb.storage.from("cafe-assets").list(prefix, { limit: 1000 });
  if (error || !Array.isArray(data)) return out;
  for (const item of data) {
    const full = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      out.push(...(await listBucketObjects(sb, full)));
    } else {
      out.push(full);
    }
  }
  return out;
}

async function updateSupabaseCloud(urlMap) {
  const envPath = path.join(rootDir, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const envRaw = fs.readFileSync(envPath, "utf8");
  const url = envRaw.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, "");
  const key = envRaw.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, "");
  if (!url || !key) return;

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  try {
    // 1. Konversi semua file non-webp yang terlanjur tersimpan di bucket cafe-assets
    const objects = await listBucketObjects(supabase, "");
    for (const objPath of objects) {
      const ext = path.extname(objPath).toLowerCase();
      if (ext === ".webp" || !SOURCE_EXTS.has(ext)) continue;

      const { data: blob, error: dlErr } = await supabase.storage.from("cafe-assets").download(objPath);
      if (dlErr || !blob) {
        console.warn(`[supabase] Gagal download ${objPath}:`, dlErr?.message);
        continue;
      }
      const bytes = Buffer.from(await blob.arrayBuffer());
      const maxWidth = objPath.startsWith("gallery/") ? 1400 : 900;
      const webpBuffer = await sharp(bytes)
        .rotate()
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();

      const webpPath = objPath.replace(/\.[^.]+$/, ".webp");
      const { error: upErr } = await supabase.storage
        .from("cafe-assets")
        .upload(webpPath, webpBuffer, { contentType: "image/webp", upsert: true });
      if (upErr) {
        console.warn(`[supabase] Gagal upload WebP ${webpPath}:`, upErr.message);
        continue;
      }

      const oldPublicUrl = supabase.storage.from("cafe-assets").getPublicUrl(objPath).data.publicUrl;
      const newPublicUrl = supabase.storage.from("cafe-assets").getPublicUrl(webpPath).data.publicUrl;
      urlMap.set(oldPublicUrl, newPublicUrl);

      await supabase.storage.from("cafe-assets").remove([objPath]);
      console.log(`✓ Supabase Storage: ${objPath} -> ${webpPath}`);
    }

    // 2. Perbarui menu_items di Supabase
    const { data: menuRows, error: mErr } = await supabase.from("menu_items").select("*");
    if (!mErr && Array.isArray(menuRows)) {
      const updates = [];
      for (const row of menuRows) {
        const nextData = replaceUrlsDeep(row.data, urlMap);
        if (JSON.stringify(nextData) !== JSON.stringify(row.data)) {
          updates.push({
            id: row.id,
            data: nextData,
            is_available: row.is_available,
            sort_order: row.sort_order,
          });
        }
      }
      if (updates.length > 0) {
        const { error: uErr } = await supabase.from("menu_items").upsert(updates, { onConflict: "id" });
        if (uErr) console.warn("[supabase] Gagal update menu_items:", uErr.message);
        else console.log(`✓ Supabase menu_items diperbarui: ${updates.length} baris -> .webp`);
      }
    }

    // 3. Perbarui content (gallery, categories, cafe, dll.) di Supabase
    const { data: contentRows, error: cErr } = await supabase.from("content").select("*");
    if (!cErr && Array.isArray(contentRows)) {
      for (const row of contentRows) {
        const nextData = replaceUrlsDeep(row.data, urlMap);
        if (JSON.stringify(nextData) !== JSON.stringify(row.data)) {
          const { error: ucErr } = await supabase
            .from("content")
            .upsert({ key: row.key, data: nextData }, { onConflict: "key" });
          if (ucErr) console.warn(`[supabase] Gagal update content.${row.key}:`, ucErr.message);
          else console.log(`✓ Supabase content.${row.key} diperbarui -> .webp`);
        }
      }
    }

    // 4. Perbarui snapshot cafesite_backups agar cadangan tidak mengembalikan URL .jpg/.png lama
    const { data: backupRows, error: bErr } = await supabase.from("cafesite_backups").select("*");
    if (!bErr && Array.isArray(backupRows)) {
      for (const row of backupRows) {
        const nextSnap = replaceUrlsDeep(row.snapshot, urlMap);
        if (JSON.stringify(nextSnap) !== JSON.stringify(row.snapshot)) {
          const { error: ubErr } = await supabase
            .from("cafesite_backups")
            .upsert({ id: row.id, snapshot: nextSnap, updated_at: new Date().toISOString() }, { onConflict: "id" });
          if (ubErr) console.warn(`[supabase] Gagal update cafesite_backups.${row.id}:`, ubErr.message);
          else console.log(`✓ Supabase cafesite_backups (${row.id}) diperbarui -> .webp`);
        }
      }
    }
  } catch (err) {
    console.warn("[supabase] Dilewati karena gagal konek:", err instanceof Error ? err.message : err);
  }
}

async function main() {
  let totalBefore = 0;
  let totalAfter = 0;
  let totalConverted = 0;
  let totalDeleted = 0;
  const urlMap = new Map();

  for (const cfg of FOLDERS) {
    const res = await convertStaticFolder(cfg.name, cfg.maxWidth, cfg.quality);
    totalBefore += res.beforeBytes;
    totalAfter += res.afterBytes;
    totalConverted += res.converted;
    totalDeleted += res.deleted;
  }

  const localUploadsConverted = await convertLocalUploads(urlMap);
  await updateSupabaseCloud(urlMap);
  const devUpdates = updateSqliteDb(".data/cafesite.dev.db", urlMap);
  const e2eUpdates = updateSqliteDb(".data/order-flow-e2e.db", urlMap);

  console.log("\n=== RINGKASAN MIGRASI WEBP ===");
  console.log(`Asset statis dikonversi / dibersihkan : ${totalConverted} / ${totalDeleted}`);
  console.log(`Upload lokal dikonversi               : ${localUploadsConverted}`);
  console.log(`Total ukuran WebP di public/Image     : ${Math.round(totalAfter / 1024)} KB`);
  console.log(`Update SQLite (dev / e2e)             : ${devUpdates} / ${e2eUpdates}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
