-- ==============================================================================
-- 09 · PERAN AKUN (ADMIN / STAF) DI TABEL staff_accounts
--
-- Jalankan di Supabase SQL Editor SEKALI. Aman diulang (idempotent).
--
-- Peran:
--   admin = akses penuh ke semua modul DAN boleh mengelola Akses tim.
--   staff = hanya modul yang dicentang di staff_permissions.
--
-- Sebelum migrasi ini dijalankan, aplikasi tetap berjalan: semua akun dianggap
-- 'staff'. Setelah migrasi, akun admin dibuat dari halaman Dashboard > Akses tim.
-- ==============================================================================

begin;

alter table public.staff_accounts
  add column if not exists role text not null default 'staff';

alter table public.staff_accounts drop constraint if exists staff_accounts_role_check;
alter table public.staff_accounts
  add constraint staff_accounts_role_check check (role in ('admin', 'staff'));

-- Akun admin awal dari seed_admin_account.sql (jika sudah dibuat) otomatis jadi admin.
update public.staff_accounts set role = 'admin' where id = 'admin-utama';

-- Simpan role juga lewat fungsi penyimpanan akun yang dipakai dashboard.
create or replace function public.cafesite_save_staff(input jsonb,permissions jsonb,revoke_sessions boolean) returns void
language plpgsql security invoker set search_path=public as $$
declare staff staff_accounts; begin
 staff:=jsonb_populate_record(null::staff_accounts,input);
 insert into staff_accounts(id,name,email,password_hash,salt,enabled,must_change_password,role,created_at)
 values(staff.id,staff.name,lower(staff.email),staff.password_hash,staff.salt,staff.enabled,staff.must_change_password,coalesce(staff.role,'staff'),staff.created_at)
 on conflict(id) do update set name=excluded.name,email=excluded.email,password_hash=excluded.password_hash,salt=excluded.salt,enabled=excluded.enabled,must_change_password=excluded.must_change_password,role=excluded.role;
 delete from staff_permissions where account_id=staff.id;
 insert into staff_permissions(account_id,module) select staff.id,value from jsonb_array_elements_text(permissions) on conflict do nothing;
 if revoke_sessions then delete from admin_sessions where account_id=staff.id; end if;
end $$;

grant execute on function public.cafesite_save_staff(jsonb,jsonb,boolean) to service_role;

commit;
