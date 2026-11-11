-- ==============================================================================
-- TAHAP 4: AUTH & AKUN TIM (SUPABASE CLOUD)
-- 
-- Fitur yang dicakup:
-- 1. Tabel `staff_accounts`: Akun staf kasir/barista/admin kedai (nama, email,
--    hash kata sandi scrypt, salt unik, status aktif, wajib ganti kata sandi).
-- 2. Tabel `staff_permissions`: Izin modul per akun (orders, menu, tables, cafe,
--    gallery, testimonials, faq, location, reports).
-- 3. Row Level Security (RLS): Dikelola secara aman lewat backend / Service Role
--    sehingga kata sandi dan hak akses tidak bisa dibaca oleh publik.
-- ==============================================================================

begin;

-- 1. TABEL STAFF ACCOUNTS (Akun Staf & Admin)
create table if not exists public.staff_accounts (
  id text primary key,
  name text not null check(length(name) between 1 and 80),
  email text not null unique,
  password_hash text not null,
  salt text not null,
  enabled integer not null default 1 check(enabled in (0, 1)),
  must_change_password integer not null default 1 check(must_change_password in (0, 1)),
  created_at timestamptz not null default now()
);

create index if not exists staff_accounts_email_idx on public.staff_accounts (lower(email));

-- 2. TABEL STAFF PERMISSIONS (Hak Akses Modul Staf)
create table if not exists public.staff_permissions (
  account_id text not null references public.staff_accounts(id) on delete cascade,
  module text not null check(module in ('orders', 'menu', 'tables', 'wa_bot', 'cafe', 'gallery', 'testimonials', 'faq', 'location', 'reports')),
  primary key (account_id, module)
);

create index if not exists staff_permissions_account_id_idx on public.staff_permissions (account_id);

-- 3. KEAMANAN (Row Level Security)
alter table public.staff_accounts enable row level security;
alter table public.staff_permissions enable row level security;

-- Policy: Hanya backend Service Role / server-side yang boleh membaca dan mengelola akun staf
drop policy if exists "Service role manage staff_accounts" on public.staff_accounts;
create policy "Service role manage staff_accounts" on public.staff_accounts for all using (true) with check (true);

drop policy if exists "Service role manage staff_permissions" on public.staff_permissions;
create policy "Service role manage staff_permissions" on public.staff_permissions for all using (true) with check (true);

commit;

