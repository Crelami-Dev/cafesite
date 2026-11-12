-- ==============================================================================
-- 10 · TABEL CADANGAN (cafesite_backups)
--
-- Dipakai untuk menyimpan snapshot SQLite lokal ke Supabase.
-- Jalankan di Supabase SQL Editor. Aman diulang (idempotent).
-- ==============================================================================

begin;

create table if not exists public.cafesite_backups (
  id text primary key,
  snapshot jsonb not null,
  updated_at timestamptz not null default now()
);

-- Hanya backend (service role) yang boleh membaca/menulis cadangan.
alter table public.cafesite_backups enable row level security;
revoke all on public.cafesite_backups from anon, authenticated;
grant all on public.cafesite_backups to service_role;

commit;

-- Minta Supabase memuat ulang daftar tabel agar langsung terbaca API.
notify pgrst, 'reload schema';
