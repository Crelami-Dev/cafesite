-- ==============================================================================
-- 11 · PENGAMAN PESANAN GANDA (idempotency) DI SUPABASE
--
-- Jalankan di Supabase SQL Editor. Aman diulang (idempotent).
--
-- Fungsi checkout sudah menolak pesanan kembar lewat kunci (advisory lock), tetapi tabel orders sendiri
-- belum punya batasan unik pada idempotency_key. Index ini menjadi pengaman terakhir di level database:
-- dua permintaan yang lolos bersamaan tetap tidak bisa membuat dua pesanan dengan kunci yang sama.
-- ==============================================================================

-- 1. Periksa dulu: bila ada kunci kembar yang sudah terlanjur ada, hasilnya tidak kosong
--    dan index di bawah akan gagal dibuat (perbaiki/hapus duplikatnya lebih dulu).
select idempotency_key, count(*) as jumlah
from public.orders
group by idempotency_key
having count(*) > 1;

-- 2. Pengaman unik pada kunci idempotensi (hanya satu pesanan per kunci).
create unique index if not exists orders_idempotency_key_unique
  on public.orders (idempotency_key);

-- 3. Nomor antrean tidak boleh kembar (cadangan bila ada penulis di luar fungsi checkout).
create unique index if not exists orders_queue_number_unique
  on public.orders (queue_number);

notify pgrst, 'reload schema';
