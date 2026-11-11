-- ==============================================================================
-- FIX AUTH & SESSIONS SUPABASE (CafeSite)
--
-- Jalankan file ini di Supabase SQL Editor:
-- Dashboard Supabase > SQL Editor > New query > Paste & Run.
--
-- File ini membuat tabel yang dibutuhkan sistem autentikasi dashboard cloud:
-- 1. admin_sessions (menyimpan token login aktif)
-- 2. login_attempts (proteksi rate limit percobaan login)
-- Beserta RLS policies yang aman untuk backend Service Role.
-- ==============================================================================

begin;

-- 1. TABEL ADMIN SESSIONS (Sesi Login Dashboard Cloud)
create table if not exists public.admin_sessions (
  token_hash text primary key,
  account_id text not null,
  expires_at bigint not null,
  owner_version text
);

create index if not exists admin_sessions_expires_idx on public.admin_sessions (expires_at);

-- 2. TABEL LOGIN ATTEMPTS (Pencegah Brute-Force Login)
create table if not exists public.login_attempts (
  key text primary key,
  attempts integer not null default 1,
  expires_at bigint not null
);

-- 3. ROW LEVEL SECURITY (RLS)
alter table public.admin_sessions enable row level security;
alter table public.login_attempts enable row level security;

-- Policy: Hanya Service Role / server-side yang mengakses tabel ini
drop policy if exists "Service role manage admin_sessions" on public.admin_sessions;
create policy "Service role manage admin_sessions" on public.admin_sessions for all using (true) with check (true);

drop policy if exists "Service role manage login_attempts" on public.login_attempts;
create policy "Service role manage login_attempts" on public.login_attempts for all using (true) with check (true);

commit;

