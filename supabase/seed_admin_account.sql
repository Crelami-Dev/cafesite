-- ==============================================================================
-- AKUN ADMINISTRATOR UTAMA (CAFESITE)
-- 
-- Email:    admin@cafesite.id
-- Password: Inicafesite1@#$
--
-- File ini bisa dijalankan di Supabase SQL Editor untuk membuat atau memperbarui
-- akun admin dengan seluruh akses modul dashboard.
-- ==============================================================================

begin;

-- 1. Buat atau perbarui akun staf di tabel staff_accounts
-- password di-hash menggunakan algoritma scryptSync 64-byte sesuai kode dashboard CafeSite
insert into public.staff_accounts (
  id,
  name,
  email,
  password_hash,
  salt,
  enabled,
  must_change_password,
  created_at
) values (
  'admin-utama',
  'Administrator Utama',
  'admin@cafesite.id',
  '052ee29463cdf85fd6f701992b319f97097eb21077264523cdf1bff45ac47b6963a4a4fb6fbd297ddab97cd16f02f7ad9001a28af2e2fd297a268fff34e42bbd',
  'cafe_admin_salt_2026',
  1,
  0,
  now()
)
on conflict (id) do update set
  email = excluded.email,
  password_hash = excluded.password_hash,
  salt = excluded.salt,
  enabled = 1,
  must_change_password = 0;

-- 2. Berikan hak akses penuh ke seluruh 10 modul operasional & pengelolaan
delete from public.staff_permissions where account_id = 'admin-utama';

insert into public.staff_permissions (account_id, module) values
  ('admin-utama', 'orders'),
  ('admin-utama', 'menu'),
  ('admin-utama', 'tables'),
  ('admin-utama', 'wa_bot'),
  ('admin-utama', 'cafe'),
  ('admin-utama', 'gallery'),
  ('admin-utama', 'testimonials'),
  ('admin-utama', 'faq'),
  ('admin-utama', 'location'),
  ('admin-utama', 'reports');

commit;

