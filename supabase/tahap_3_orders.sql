-- ==============================================================================
-- TAHAP 3: PESANAN & TRANSAKSI PELANGGAN (SUPABASE CLOUD)
-- 
-- Fitur yang dicakup:
-- 1. Sequence `order_queue_seq`: Penomoran antrean otomatis (1, 2, 3, dst).
-- 2. Tabel `orders`: Transaksi pesanan (nomor antrean, nama pelanggan, nomor WA,
--    tipe dine_in/takeaway, meja, status pesanan, pembayaran, total belanja,
--    sumber website/kasir).
-- 3. Tabel `order_items`: Rincian item yang dipesan (nama menu, harga satuan,
--    jumlah qty, catatan khusus per item).
-- 4. Indeks performa: Indeks antrean aktif, tanggal pesanan, dan relasi meja.
-- 5. Row Level Security (RLS): Pembacaan dan pembuatan pesanan diamankan lewat backend
--    (Next.js API & Service Role).
-- 
-- Catatan Keamanan & Kompatibilitas:
-- 1. Tamu pemesan QR meja TIDAK DIWAJIBKAN login auth Supabase (user_id fleksibel / nullable).
-- 2. Folder `server/` (WhatsApp Bot, file RAG, sesi Baileys) 100% DIISOLASI
--    dan TIDAK ADA di dalam file ini.
-- ==============================================================================

begin;

-- 1. SEQUENCE NOMOR ANTREAN
create sequence if not exists public.order_queue_seq;

-- 2. TABEL ORDERS (Pesanan Kedai)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  idempotency_key uuid not null,
  queue_number bigint not null default nextval('public.order_queue_seq'),
  customer_name text not null check(length(customer_name) between 2 and 80),
  phone text not null check(phone ~ '^[0-9]{8,20}$'),
  fulfillment text not null check(fulfillment in ('dine_in', 'takeaway')),
  table_id text references public.cafe_tables(id) on delete restrict,
  status text not null default 'waiting' check(status in ('waiting', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_method text not null default 'cod' check(payment_method in ('cod', 'cash', 'qris', 'transfer')),
  payment_status text not null default 'unpaid' check(payment_status in ('unpaid', 'paid')),
  total bigint not null default 0 check(total between 0 and 100000000),
  paid_amount bigint not null default 0 check(paid_amount >= 0 and paid_amount <= total),
  source text not null default 'website' check(source in ('website', 'whatsapp', 'pos')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((fulfillment = 'dine_in' and table_id is not null) or (fulfillment = 'takeaway' and table_id is null)),
  check ((payment_status = 'paid' and paid_amount = total) or (payment_status = 'unpaid' and paid_amount = 0))
);

-- Batasi hanya boleh ada satu pesanan aktif per meja (mencegah tabrakan pemesanan di meja yang sama)
create unique index if not exists one_active_order_per_table on public.orders(table_id)
  where table_id is not null and status in ('waiting', 'preparing', 'ready');

-- Indeks pencarian dan laporan
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_table_id_idx on public.orders (table_id);

-- 3. TABEL ORDER_ITEMS (Item Menu di Setiap Pesanan)
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id text not null,
  name text not null,
  unit_price bigint not null check(unit_price between 0 and 10000000),
  quantity integer not null check(quantity between 1 and 20),
  notes text not null default '' check(length(notes) <= 300),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- 4. KEAMANAN & HAK AKSES (Row Level Security)
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Policy: Backend Service Role (Next.js server & dashboard) mengelola data pesanan secara aman
drop policy if exists "Service role manage orders" on public.orders;
create policy "Service role manage orders" on public.orders for all to service_role using (true) with check (true);

drop policy if exists "Service role manage order_items" on public.order_items;
create policy "Service role manage order_items" on public.order_items for all to service_role using (true) with check (true);

commit;

