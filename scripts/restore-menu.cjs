const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { DatabaseSync } = require('node:sqlite');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);
const db = new DatabaseSync('.data/cafesite.dev.db');

// Parse data menuItems dari src/data/menu.ts secara sederhana atau ekstrak objek
// Kita ambil file menu.ts dan ekstrak array menuItems
const menuTs = fs.readFileSync('src/data/menu.ts', 'utf8');
const cafeTs = fs.readFileSync('src/data/cafe.ts', 'utf8');

// Ekstrak menuItems JSON via regex/eval parser aman
const startIdx = menuTs.indexOf('export const menuItems: MenuItem[] = [');
const endIdx = menuTs.lastIndexOf('];');
const arrayStr = menuTs.slice(startIdx + 'export const menuItems: MenuItem[] = '.length, endIdx + 1);

// Convert TypeScript array ke valid JS
const cleanedStr = arrayStr
  .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '') // hapus komentar
  .replace(/,\s*]/g, ']') // hapus trailing comma di array
  .replace(/,\s*}/g, '}'); // hapus trailing comma di object

let menuItems = [];
try {
  menuItems = new Function(`return ${cleanedStr}`)();
} catch (e) {
  console.error('Gagal parse menu:', e);
  process.exit(1);
}

// Kategori default
const menuCategories = [
  { id: "coffee", name: "Coffee", description: "Biji Nusantara yang kami sangrai sendiri, plus espresso yang diracik pelan" },
  { id: "non-coffee", name: "Non-Coffee", description: "Teh, matcha Uji, dan mocktail — buat hari-hari yang nggak ngopi" },
  { id: "food", name: "Food", description: "Makanan berat dengan bumbu yang nggak malu-malu" },
  { id: "snack", name: "Snack", description: "Camilan gurih yang bikin ngobrol makin lama" },
  { id: "dessert", name: "Dessert", description: "Penutup yang susah ditolak. Serius." },
];

console.log(`Berhasil membaca ${menuItems.length} menu default.`);

// 1. Simpan ke SQLite lokal
const insertMenu = db.prepare('INSERT OR REPLACE INTO menu_items (id, data, is_available, sort_order) VALUES (?, ?, ?, ?)');
db.exec('BEGIN IMMEDIATE');
menuItems.forEach((item, index) => {
  const { id, isAvailable, ...rest } = item;
  insertMenu.run(id, JSON.stringify({ ...rest, id }), isAvailable === false ? 0 : 1, index);
});
db.prepare('INSERT OR REPLACE INTO content (key, data) VALUES (?, ?)').run('categories', JSON.stringify(menuCategories));
db.exec('COMMIT');
console.log('✅ SQLite lokal berhasil diisi kembali dengan seluruh menu!');

// 2. Simpan ke Supabase Cloud
async function uploadToSupabase() {
  const payload = menuItems.map((item, index) => ({
    id: item.id,
    data: item,
    is_available: item.isAvailable !== false,
    sort_order: index,
  }));

  const { error: menuErr } = await supabase.from('menu_items').upsert(payload, { onConflict: 'id' });
  if (menuErr) {
    console.error('❌ Gagal upload menu ke Supabase:', menuErr.message);
  } else {
    console.log(`✅ Berhasil upload ${payload.length} menu ke Supabase Cloud!`);
  }

  const { error: catErr } = await supabase.from('content').upsert({
    key: 'categories',
    data: menuCategories,
  }, { onConflict: 'key' });

  if (catErr) {
    console.error('❌ Gagal upload categories ke Supabase:', catErr.message);
  } else {
    console.log('✅ Berhasil upload categories ke Supabase Cloud!');
  }
}

uploadToSupabase();
