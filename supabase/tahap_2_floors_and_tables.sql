-- ==============================================================================
-- TAHAP 2: TATA LETAK LANTAI & MEJA KEDAI (SUPABASE CLOUD)
-- 
-- Fitur yang dicakup:
-- 1. Tabel `floors`: Daftar lantai kedai (misal: Lantai 1, Lantai 2, Teras Luar).
-- 2. Tabel `cafe_tables`: Daftar meja fisik kedai (ID meja, label, status
--    'available' / 'occupied' / 'dirty', dan relasi ke lantai).
-- 3. Row Level Security (RLS): Pengunjung umum boleh membaca (SELECT) agar sistem
--    bisa memvalidasi QR meja saat scan, sedangkan penulisan dikelola lewat
--    dashboard / sync server.
-- 
-- Catatan Keamanan:
-- Folder `server/` (WhatsApp Bot, file RAG, sesi Baileys) 100% DIISOLASI
-- dan TIDAK ADA di dalam file ini.
-- ==============================================================================

begin;

-- 1. TABEL FLOORS (Lantai Kedai)
-- Menggunakan id berformat text/varchar agar kompatibel dengan UUID dari SQLite maupun Supabase
create table if not exists public.floors (
  id text primary key,
  name text not null check (length(name) between 1 and 80),
  sort_order integer not null default 0
);

create index if not exists floors_sort_order_idx on public.floors (sort_order asc);

-- 2. TABEL CAFE_TABLES (Meja Kedai & QR)
create table if not exists public.cafe_tables (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{1,40}$'),
  floor_id text not null references public.floors(id) on delete restrict,
  label text not null check (length(label) between 1 and 80),
  x numeric not null default 10 check (x between 0 and 100),
  y numeric not null default 10 check (y between 0 and 100),
  status text not null default 'available' check (status in ('available', 'occupied', 'dirty'))
);

create index if not exists cafe_tables_floor_id_idx on public.cafe_tables (floor_id);

-- 3. KEAMANAN & HAK AKSES (Row Level Security)
alter table public.floors enable row level security;
alter table public.cafe_tables enable row level security;

-- Policy: Publik boleh membaca lantai dan status meja (untuk validasi QR code pelanggan)
drop policy if exists "Public read floors" on public.floors;
create policy "Public read floors" on public.floors for select using (true);

drop policy if exists "Public read cafe_tables" on public.cafe_tables;
create policy "Public read cafe_tables" on public.cafe_tables for select using (true);

-- Policy: Backend Service Role (Next.js server sync dari SQLite) boleh kelola penuh
drop policy if exists "Service role manage floors" on public.floors;
create policy "Service role manage floors" on public.floors for all to service_role using (true) with check (true);

drop policy if exists "Service role manage cafe_tables" on public.cafe_tables;
create policy "Service role manage cafe_tables" on public.cafe_tables for all to service_role using (true) with check (true);

commit;

