-- ==============================================================================
-- TAHAP 1: KONTEN KEDAI & MENU DINAMIS (SUPABASE CLOUD)
-- 
-- Fitur yang dicakup:
-- 1. Tabel `content`: Info kafe, jam buka, galeri foto, FAQ, panduan lokasi,
--    testimoni, dan daftar kategori menu.
-- 2. Tabel `menu_items`: Katalog makanan & minuman dengan kategori dinamis
--    (bebas tambah kategori baru tanpa dibatasi constraint statis).
-- 3. Row Level Security (RLS): Pengunjung umum boleh baca (SELECT),
--    sedangkan penulisan diamankan lewat backend (Service Role / Dashboard).
-- 
-- Catatan Keamanan:
-- Folder `server/` (WhatsApp Bot, file RAG, sesi Baileys) 100% DIISOLASI
-- dan TIDAK ADA di dalam file ini.
-- ==============================================================================

begin;

-- 1. TABEL CONTENT
create table if not exists public.content (
  key text primary key,
  data jsonb not null
);

-- Pastikan seluruh modul konten yang ada di dashboard diizinkan
alter table public.content drop constraint if exists content_key_check;
alter table public.content add constraint content_key_check check (
  key in ('cafe', 'gallery', 'testimonials', 'faq', 'location', 'categories')
);

-- 2. TABEL MENU ITEMS (Kategori Fleksibel)
create table if not exists public.menu_items (
  id text primary key check (length(id) between 1 and 80),
  data jsonb not null,
  is_available boolean not null default true,
  sort_order integer not null default 0
);

-- Validasi item menu: format JSON valid, harga terdefinisi, nama kategori fleksibel 1-80 karakter
alter table public.menu_items drop constraint if exists menu_items_data_check;
alter table public.menu_items add constraint menu_items_data_check check (
  jsonb_typeof(data) = 'object'
  and data->>'id' = id
  and data ? 'price'
  and jsonb_typeof(data->'price') = 'number'
  and (data->>'price')::numeric between 0 and 10000000
  and (data->>'price')::numeric = trunc((data->>'price')::numeric)
  and length(trim(coalesce(data->>'category', ''))) between 1 and 80
);

-- Index urutan tampilan menu
create index if not exists menu_items_sort_order_idx on public.menu_items (sort_order asc);

-- 3. KEAMANAN & HAK AKSES (Row Level Security)
alter table public.content enable row level security;
alter table public.menu_items enable row level security;

-- Policy: Publik (pengunjung web) boleh membaca konten & menu
drop policy if exists "Public read content" on public.content;
create policy "Public read content" on public.content for select using (true);

drop policy if exists "Public read menu" on public.menu_items;
create policy "Public read menu" on public.menu_items for select using (true);

-- Policy: Backend Service Role (Next.js server sync dari SQLite) boleh kelola penuh
drop policy if exists "Service role manage content" on public.content;
create policy "Service role manage content" on public.content for all to service_role using (true) with check (true);

drop policy if exists "Service role manage menu" on public.menu_items;
create policy "Service role manage menu" on public.menu_items for all to service_role using (true) with check (true);

commit;

