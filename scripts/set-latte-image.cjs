const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { DatabaseSync } = require('node:sqlite');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);
const db = new DatabaseSync('.data/cafesite.dev.db');

const imagePath = '/Image/Menu/Coffee_Latte.png';

// 1. Update di SQLite lokal
const row = db.prepare("SELECT data FROM menu_items WHERE id = 'cfe-lte'").get();
if (row) {
  const current = JSON.parse(row.data);
  current.image = imagePath;
  db.prepare("UPDATE menu_items SET data = ? WHERE id = 'cfe-lte'").run(JSON.stringify(current));
  console.log('✅ SQLite updated image:', imagePath);
}

// 2. Update di Supabase Cloud
async function updateCloud() {
  const { data: item } = await supabase.from('menu_items').select('*').eq('id', 'cfe-lte').maybeSingle();
  if (item) {
    const updatedData = { ...item.data, image: imagePath };
    const { error } = await supabase.from('menu_items').update({ data: updatedData }).eq('id', 'cfe-lte');
    if (error) console.error('❌ Supabase error:', error.message);
    else console.log('✅ Supabase updated image successfully!');
  }
}
updateCloud();
