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

const SOURCE_EXTS = new Set([".jpg", ".jpeg", ".png"]);
const rootDir = process.cwd();

function toWebpUrl(url) {
  if (typeof url !== "string") return url;
  if (!url.startsWith("/Image/")) return url;
  return url.replace(/\.(jpe?g|png)$/i, ".webp");
}

function walkAndConvert(folder, maxWidth, quality) {
  const dir = path.join(rootDir, "public", "Image", folder);
  if (!fs.existsSync(dir)) return Promise.resolve({ beforeBytes: 0, afterBytes: 0, converted: 0, deleted: 0 });
  const files = fs.readdirSync(dir);

  return (async () => {
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
      if (webpSize <= 0) {
        throw new Error(`Hasil WebP kosong untuk ${fullPath}`);
      }
      afterBytes += webpSize;
      converted += 1;

      fs.unlinkSync(fullPath);
      deleted += 1;

      console.log(
        `✓ Image/${folder}/${file} (${Math.round(srcSize / 1024)} KB) -> ${base}.webp (${Math.round(webpSize / 1024)} KB)`,
      );
    }

    return { beforeBytes, afterBytes, converted, deleted };
  })();
}

function updateSqliteDb(dbFile) {
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
      const nextImg = toWebpUrl(data.image);
      if (nextImg && nextImg !== data.image) {
        data.image = nextImg;
        updateMenu.run(JSON.stringify(data), row.id);
        updatedCount += 1;
      }
    }

    const contentRows = db.prepare("SELECT key, data FROM content").all();
    const updateContent = db.prepare("UPDATE content SET data = ? WHERE key = ?");
    for (const row of contentRows) {
      if (row.key === "gallery") {
        const list = JSON.parse(row.data);
        if (Array.isArray(list)) {
          let dirty = false;
          const nextList = list.map((item) => {
            const nextSrc = toWebpUrl(item?.src);
            if (nextSrc && nextSrc !== item.src) {
              dirty = true;
              return { ...item, src: nextSrc };
            }
            return item;
          });
          if (dirty) {
            updateContent.run(JSON.stringify(nextList), row.key);
            updatedCount += 1;
          }
        }
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

async function updateSupabaseCloud() {
  const envPath = path.join(rootDir, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const envRaw = fs.readFileSync(envPath, "utf8");
  const urlMatch = envRaw.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m);
  const keyMatch = envRaw.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m);
  if (!urlMatch || !keyMatch) return;

  const url = urlMatch[1].trim().replace(/^['"]|['"]$/g, "");
  const key = keyMatch[1].trim().replace(/^['"]|['"]$/g, "");
  if (!url || !key) return;

  const supabase = createClient(url, key);
  try {
    const { data: menuRows, error: mErr } = await supabase.from("menu_items").select("*");
    if (mErr) {
      console.warn("[supabase] Lewati menu_items:", mErr.message);
    } else if (Array.isArray(menuRows)) {
      const updates = [];
      for (const row of menuRows) {
        const nextImg = toWebpUrl(row.data?.image);
        if (nextImg && nextImg !== row.data.image) {
          updates.push({
            id: row.id,
            data: { ...row.data, image: nextImg },
            is_available: row.is_available,
            sort_order: row.sort_order,
          });
        }
      }
      if (updates.length > 0) {
        const { error: uErr } = await supabase.from("menu_items").upsert(updates, { onConflict: "id" });
        if (uErr) console.warn("[supabase] Gagal update menu_items:", uErr.message);
        else console.log(`✓ Supabase menu_items diperbarui: ${updates.length} item -> .webp`);
      }
    }

    const { data: galleryRow, error: gErr } = await supabase
      .from("content")
      .select("*")
      .eq("key", "gallery")
      .maybeSingle();
    if (!gErr && galleryRow && Array.isArray(galleryRow.data)) {
      let dirty = false;
      const nextGallery = galleryRow.data.map((item) => {
        const nextSrc = toWebpUrl(item?.src);
        if (nextSrc && nextSrc !== item.src) {
          dirty = true;
          return { ...item, src: nextSrc };
        }
        return item;
      });
      if (dirty) {
        const { error: ugErr } = await supabase
          .from("content")
          .upsert({ key: "gallery", data: nextGallery }, { onConflict: "key" });
        if (ugErr) console.warn("[supabase] Gagal update content.gallery:", ugErr.message);
        else console.log("✓ Supabase content.gallery diperbarui -> .webp");
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

  for (const cfg of FOLDERS) {
    const res = await walkAndConvert(cfg.name, cfg.maxWidth, cfg.quality);
    totalBefore += res.beforeBytes;
    totalAfter += res.afterBytes;
    totalConverted += res.converted;
    totalDeleted += res.deleted;
  }

  const devUpdates = updateSqliteDb(".data/cafesite.dev.db");
  const e2eUpdates = updateSqliteDb(".data/order-flow-e2e.db");
  await updateSupabaseCloud();

  console.log("\n=== RINGKASAN KONVERSI WEBP ===");
  console.log(`File sumber dikonversi & dibersihkan : ${totalConverted} / ${totalDeleted}`);
  console.log(`Total ukuran sumber yang diganti     : ${Math.round(totalBefore / 1024)} KB`);
  console.log(`Total seluruh WebP di public/Image   : ${Math.round(totalAfter / 1024)} KB`);
  console.log(`Update SQLite (dev / e2e)            : ${devUpdates} / ${e2eUpdates}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

