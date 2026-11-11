const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
const { DatabaseSync } = require('node:sqlite');

const menuDir = path.join(process.cwd(), 'public', 'Image', 'Menu');
const files = fs.readdirSync(menuDir);

async function convertAndOptimize() {
  console.log('--- Mengonversi gambar menu ke WebP teroptimasi ---');
  const mapping = {};

  for (const file of files) {
    if (file.endsWith('.webp')) continue;
    const ext = path.extname(file);
    const basename = path.basename(file, ext);
    const inputPath = path.join(menuDir, file);
    const outputPath = path.join(menuDir, `${basename}.webp`);

    const beforeStat = fs.statSync(inputPath);
    await sharp(inputPath)
      .resize({ width: 800, withoutEnlargement: true }) // ukuran optimal untuk card & picker
      .webp({ quality: 80, effort: 4 })
      .toFile(outputPath);

    const afterStat = fs.statSync(outputPath);
    console.log(`✓ ${file} (${Math.round(beforeStat.size / 1024)} KB) -> ${basename}.webp (${Math.round(afterStat.size / 1024)} KB) [Hemat ${Math.round((1 - afterStat.size / beforeStat.size) * 100)}%]`);

    mapping[`/Image/Menu/${file}`] = `/Image/Menu/${basename}.webp`;
  }

  // Update SQLite lokal
  console.log('\n--- Mengupdate database SQLite lokal ---');
  const db = new DatabaseSync('.data/cafesite.dev.db');
  const rows = db.prepare('SELECT id, data FROM menu_items').all();
  db.exec('BEGIN IMMEDIATE');
  const updateStmt = db.prepare('UPDATE menu_items SET data = ? WHERE id = ?');
  
  for (const row of rows) {
    const data = JSON.parse(row.data);
    if (data.image) {
      const ext = path.extname(data.image);
      const basename = path.basename(data.image, ext);
      const newWebp = `/Image/Menu/${basename}.webp`;
      if (fs.existsSync(path.join(process.cwd(), 'public', newWebp.replace(/^\//, '')))) {
        data.image = newWebp;
        updateStmt.run(JSON.stringify(data), row.id);
      }
    }
  }
  db.exec('COMMIT');
  console.log('✅ SQLite berhasil diperbarui ke URL WebP!');

  // Update Supabase Cloud
  console.log('\n--- Mengupdate database Supabase Cloud ---');
  const env = fs.readFileSync('.env.local', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
  const supabase = createClient(url, key);

  const { data: cloudItems, error: fetchErr } = await supabase.from('menu_items').select('*');
  if (fetchErr) {
    console.error('Gagal mengambil data dari Supabase:', fetchErr.message);
    return;
  }

  const updates = cloudItems.map((item) => {
    const data = item.data;
    if (data && data.image) {
      const ext = path.extname(data.image);
      const basename = path.basename(data.image, ext);
      const newWebp = `/Image/Menu/${basename}.webp`;
      data.image = newWebp;
    }
    return {
      id: item.id,
      data: data,
      is_available: item.is_available,
      sort_order: item.sort_order,
    };
  });

  const { error: upsertErr } = await supabase.from('menu_items').upsert(updates, { onConflict: 'id' });
  if (upsertErr) {
    console.error('Gagal mengupdate Supabase:', upsertErr.message);
  } else {
    console.log(`✅ Berhasil mengupdate ${updates.length} menu di Supabase Cloud ke WebP!`);
  }
}

convertAndOptimize().catch(console.error);

