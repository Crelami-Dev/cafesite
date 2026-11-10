> **ARSIP.** Dokumen ini menggambarkan versi lama (Supabase). Bot sekarang memakai SQLite dan ditautkan lewat dashboard; panduan terkini: `docs/WHATSAPP_BOT_OPENWA_REPORT.md`.

# WA_BOT_PLAN.md — Plan Bot WhatsApp CafeSite (wa-webjs + Nemotron + RAG)

> Dokumen ini berisi **rencana kerja sampai bot stabil/"fix"** dan **prompt per phase** yang siap di-paste ke AI coding agent. Bot jalan di folder `server/` (project Node.js + TypeScript terpisah, BUKAN di dalam Next.js). AI milik bot memakai **NVIDIA Nemotron** via **NVIDIA API langsung** (`integrate.api.nvidia.com`), bukan OpenRouter.
>
> Status: **Phase 1 & 2 sudah berjalan di `server/`** (AI Hub + guard, build 0 error). Phase 3–5 menyusul.

---

## 0. Ringkasan Arsitektur

```
Gambar kerja (dev):

  Admin upload PDF (nanti via website) ─┐
                                        ▼
  Supabase (Storage + Postgres + pgvector)   ← tempat RAG disimpan (chunk + vector)
                                        ▲
  ┌───────────────── server/ (VPS 24/7) ─────────────────┐
  │  wa-webjs (session WhatsApp, jalan terus)            │
  │    │                                                 │
  │    ├─ AI call → NVIDIA API (integrate.api.nvidia.com) → nvidia/nemotron-3.5-lightning-30b-a3b
  │    ├─ RAG: cari context → kirim ke AI → jawab
  │    ├─ Order flow (dev: keyword "bayar") → insert ke tabel orders
  │    ▼
  └───────────────┐
                  ▼
   Dashboard /admin (Next.js yang sudah ada) — pesanan WA masuk di sini (Realtime)
```

- **AI (Nemotron) TIDAK pernah dijalankan lokal di VPS.** VPS hanya memanggil NVIDIA API (`https://integrate.api.nvidia.com/v1/chat/completions`, OpenAI-compatible, header `Authorization: Bearer $NVIDIA_API_KEY`).
- **Supabase dipakai untuk** vektor RAG + metadata + storage PDF + tabel `orders` (agar order WA tampil di dashboard yang sudah ada).
- **Order via WA belum pakai payment gateway.** Dev = customer cukup ketik `bayar` (placeholder). Integrasi iPaymu QRIS dijadwalkan setelah fase ini, merujuk `ipaymu.md`.

---

## 1. Aturan Dasar (wajib untuk semua phase)

1. **Folder target:** `server/` di root repo ini, dengan `package.json` sendiri (ISI penuh terpisah dari root — jangan tambahkan dependency bot ke package.json Next.js).
2. **Bahasa:** TypeScript strict. Semua env lewat `.env` (file `.env.example` wajib dibuat).
3. **wa-webjs:** pascal session persistent (`LocalAuth`), login QR dicetak ke console + bisa ditampilkan ulang. Bot wajib auto-reconnect.
4. **AI Reinforcement (guard) — WAJIB ada di semua phase AI:**
   - Hanya boleh menjawab informasi seputar tempat/cafe: menu (dari data CafeSite), ketersediaan meja, jam buka, lokasi, dan pertanyaan yang dijawab oleh RAG.
   - DILARANG: pendapat pribadi AI, informasi pribadi pemilik/karyawan, gosip, rekomendasi pribadi, hal di luar konteks cafe.
   - Kalau tidak yakin / di luar topik → jawab SOP (lihat system prompt di Phase 2).
5. **Order via WA:** `bayar` = placeholder pembayaran (dev). Produksi nanti diganti iPaymu (lihat `ipaymu.md`).
6. Jangan commit secret. Semua kredensial lewat `.env` (`.gitignore` di `server/`).

---

## 2. Fase Rencana (sampai "fix")

| Fase | Target "fix" (kriteria selesai) | Isi |
|---|---|---|
| **P1 — Laying** | Bot WhatsApp hidup & bisa balas pesan | Folde `server/`, wa-webjs + session, hello/ping, auto-reconnect, QR login |
| **P2 — AI Hub** | Bot bisa jawab pertanyaan cafe pakai Nemotron | Call NVIDIA API, system prompt + topic guard, fallback SOP |
| **P3 — RAG** | RAG jalan: PDF upload → chunk → embed → simpan → retrieve | Pipeline ingest (script), similarity search, context ke AI, cleanup |
| **P4 — Order** | Order via WA masuk dashboard pakai kata `bayar` | Ambil item dari tabel `menu_items`, hitung total, alur konfirmasi, insert ke `orders` (service role), badge ke dashboard |
| **P5 — Ops** | Stabil jalan 24/7 di VPS | PM2/systemd, log, restart otomatis, rate-limit anti-spam, monitoring |
| **FUTURE** | (BUKAN bagian sekarang) | Ganti `bayar` → iPaymu QRIS (pakai `ipaymu.md`), upload PDF via website |

---

## 3. Keputusan & Risiko yang Harus Diingat (context untuk semua phase)

- **`orders.user_id` wajib UUID dari `auth.users`** (lihat `supabase/01_schema.sql`). WhatsApp bukan login Supabase → bot harus pakai **akun user khusus bot** (dibuat sekali di Supabase Auth) dan insert pakai **`service_role` key** (dari `server/.env`), dengan `idempotency_key` unik per order.
- **`payment_method` di tabel `orders` hanya menerima `'cod'`** (constraint di schema). Untuk dev, bot insert dengan `payment_method='cod'` `payment_status='paid' simulasikan` via fungsi `update_cafe_order(mark_paid=true)` — atau diskusikan alter constraint per kebutuhan. Jangan ubah schema di luar kebutuhan.
- **Menu dibaca dari tabel `menu_items` Supabase** (bukan dari `data/menu.ts`), agar selaras dengan dashboard (termasuk `is_available` = habis).
- **wa-webjs tidak 100% stabil** dan rawan diblokir jika dipakai massal; batasi ke kebutuhan cafe (starter).
- **Embedding untuk RAG** masih open decision: pantau biaya. Rekomendasi awal: pakai `pgvector` + embedding yang diset via env (bukan hardcode). Karena stack AI sudah di **NVIDIA API**, cek dulu di `build.nvidia.com` apakah ada model embedding NVIDIA yang gratis/murah — baru pilih; jangan otomatis pakai OpenAI `text-embedding-3-small` tanpa membandingkan.

---

## 4. Prompt Per Phase

> Cara pakai: copy blok prompt (antara `---` dan `---` berikutnya) ke AI coding agent dan jalankan di repo ini. Setiap phase dimulai dari status repo saat ini (folder `server/` dikerjakan bertahap).

### PHASE 1 — Prompt: Servis WhatsApp (wa-webjs)

```
Tugasmu: buat fondasi bot WhatsApp di folder `server/` di repo CafeSite ini (Windows local dev dulu, target VPS Linux).

## Hasil akhir yang dicapai
1. Folder `server/` adalah project Node.js + TypeScript STANDALONE (package.json sendiri, tsconfig sendiri). JANGAN sentuh/menambah dep ke root package.json Next.js.
2. Bot wa-webjs bisa:
   - Login via QR (tampilkan QR di console pakai `qrcode-terminal`), session persistent dengan `LocalAuth` (folder `server/session/`).
   - Auto-reconnect saat disconnect/tidak sinkron.
   - Multi-device ready (pakai lib: `whatsapp-web.js`).
   - Balas pesan kosong/ping dengan "✓ Bot CafeSite aktif".
3. Struktur:
   server/
     .env.example   (lengkapi: NVIDIA_API_KEY, NVIDIA_MODEL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WA_BOT_PHONE) — belum dipakai phase ini, siapkan saja
     .gitignore     (node_modules, .env, session)
     package.json   (script: "dev": "tsx watch src/index.ts", "start": "node dist/index.js")
     tsconfig.json
     src/index.ts         (entry: start client + daftarkan event)
     src/config/env.ts    (baca env, throw kalau missing)
     src/whatsapp/client.ts  (setup wa-webjs + LocalAuth + reconnect)
     src/whatsapp/logger.ts  (log dengan timestamp)
4. Jangan tambahkan fitur AI/RAG/order di phase ini.

## Verifikasi
- `npm run dev` di `server/` menampilkan QR, scan dengan WhatsApp (mode perangkat tertaut), kirim "ping" → balas "✓ Bot CafeSite aktif".
- File `.env.example` berisi placeholder yang jelas, gunakan variabel di atas.

## Revisi jika gagal
- Jika wa-webjs gagal konek (versi Node), laporkan error mentah dan sesuaikan.
```

---

### PHASE 2 — Prompt: AI Hub (Nemotron + guard)

```
Tugasmu: tambahkan "otak AI" ke bot WhatsApp di `server/` (lanjutkan dari Phase 1). AI memakai model NVIDIA Nemotron yang diakses VIA NVIDIA API langsung — JANGAN pernah menjalankan model lokal.

## Model (wajib sesuai)
- Production: `nvidia/nemotron-3.5-lightning-30b-a3b` (NVIDIA Nemotron 3.5 Lightning 30B) via NVIDIA API (bukan OpenRouter). Endpoint OpenAI-compatible: https://integrate.api.nvidia.com/v1/chat/completions
- Key: format `nvapi-...`, didapat dari build.nvidia.com → env `NVIDIA_API_KEY`; model ID dari env `NVIDIA_MODEL`.
- Header auth: `Authorization: Bearer <NVIDIA_API_KEY>`. TIDAK ada header `HTTP-Referer`/`X-Title` (itu khusus OpenRouter, tidak dipakai di NVIDIA API).
- Body: format messages OpenAI-compatible (`role`/`content`), **non-streaming (`stream: false`)** — bot WhatsApp butuh teks lengkap sekaligus, bukan potongan per-chunk.
- Panggil pakai `fetch` native Node.js. JANGAN pakai SDK `openai` (tanpa dependency tambahan).
- Alternatif hemat kuota untuk testing: cek dulu di build.nvidia.com apakah ada model setara yang gratis/murah — jangan asumsi pakai ID model OpenRouter yang lama (`...-reasoning:free`); ID OpenRouter ≠ ID NVIDIA API.

## Apa yang dibuat
1. `src/ai/nemotronClient.ts` — fungsi `askAI(config, messages)` panggil NVIDIA API, handle error/timeout (AbortController)/retry 1x, return text. Config dari `getNemotronConfig(env)` di `env.ts` (validasi lazy, bukan saat startup).
2. `src/ai/systemPrompt.ts` — Ekspor SYSTEM_PROMPT (lihat isi wajib di bawah).
3. `src/ai/guard.ts` — fungsi penjaga topik PRA-AI:
   - Daftar kata kunci cafe (menu, harga, jam buka, lokasi, meja, resepsi, kepada dll).
   - Jika pesan user tidak menyangkut cafe → BALAS segera dengan SOP tanpa panggil AI (mis. "Maaf, saya hanya bisa bantu soal CafeSite ☕").
4. `src/ai/types.ts` — tipe `ChatMessage` = `{ role: "system" | "user" | "assistant"; content: string }`.
5. `src/ai/chatHandler.ts` — dipanggil dari WA: guard → (nanti: retrieve RAG) → build messages → `askAI` → kirim balik. Fase ini RAG belum ada, langsung panggil AI dengan prompt + system prompt. Terima input primitif (bukan objek wa-webjs) agar mudah diuji.
6. Integrasi ke bot WhatsApp (`src/whatsapp/client.ts` / handler pesan):
   - SEMUA pesan teks user (skip status@broadcast & `message.fromMe`) → `handleChat`.
   - Kirim "sedang mengetik..." (`message.startTyping()`) sebelum panggil AI, stop setelah selesai.
   - Error dari AI → balas ramah ("Sebentar ya, saya lagi gangguan koneksi. Coba lagi."), jangan crash.

## SYSTEM_PROMPT (isi minimal, boleh diperluas):
Kamu adalah asisten WhatsApp resmi CafeSite. Tugasmu HANYA menjawab pertanyaan seputar CafeSite berdasarkan informasi yang diberikan. ATURAN: (1) Hanya bicara tentang CafeSite: menu & harga, jam buka, lokasi, ketersediaan meja, dan info yang ada di konteks. (2) JANGAN pernah: memberi pendapat pribadi, menceritakan informasi pribadi pemilik/karyawan, membocorkan data orang lain, atau menjawab topik di luar cafe. (3) Jika tidak yakin atau di luar topik, katakan: "Maaf, saya hanya bisa membantu soal CafeSite ☕ Tanya seputar menu, jam buka, atau lokasi ya." (4) Jawab singkat, ramah, bahasa Indonesia santai.

## Verifikasi
- Kirim "menu apa saja yang ada?" → AI jawab (walaupun tanpa RAG, jawab dari pengetahuan/prompt umum).
- Kirim "kerjaan rumah saya bagaimana?" → guard menolak tanpa panggil AI.
- Log berisi timestamp untuk tiap call.
```

---

### PHASE 3 — Prompt: RAG Pipeline (Supabase + pgvector)

```
Tugasmu: tambahkan RAG (Retrieval-Augmented Generation) ke bot `server/`. Dokumen sumber = PDF info cafe (menu lengkap, aturan, FAQ). RAG disimpan cloud di Supabase.

## Prasyarat yang harus kamu pastikan dulu (baca & ikuti)
- Baca `supabase/01_schema.sql` (aturan tabel & RLS di project ini; jangan rusak: semua tulis lewat `service_role` dari server).
- Aktifkan ekstensi `vector` (pgvector) di project Supabase klien (jalankan `create extension if not exists vector;`).
- Buat tabel chunk:
  ```sql
  create table if not exists public.rag_documents (
    id uuid primary key default gen_random_uuid(),
    source text not null,          -- nama pdf / sumber
    content text not null,
    embedding vector(1536),        -- sesuaikan dimensi embedding yang dipilih
    created_at timestamptz not null default now()
  );
  create index on public.rag_documents using hnsw (embedding vector_cosine_ops);
  alter table public.rag_documents enable row level security;
  -- Baca: anon & authenticated; tulis: service_role saja
  create policy rag_read on public.rag_documents for select to anon,authenticated using(true);
  revoke all on public.rag_documents from anon,authenticated;
  grant select on public.rag_documents to anon,authenticated;
  grant all on public.rag_documents to service_role;
  ```

## Yang dibuat di `server/`
1. `src/rag/ingest.ts` — script CLI `npm run rag:ingest <path.pdf>`:
   - Parse PDF (pakai library ringan, mis. `pdf-parse`).
   - Chunking by heading/paragraf (~600-800 char, overlap kecil).
   - Embed tiap chunk (embedding model dari env `EMBEDDING_MODEL`, `EMBEDDING_API_KEY`, `EMBEDDING_BASE_URL`). Karena AI lain sudah di ecosystem NVIDIA, CEK DULU di build.nvidia.com apakah ada model embedding NVIDIA yang gratis/murah sebelum memilih — jangan otomatis pakai OpenAI `text-embedding-3-small`.
   - Hapus chunk lama dari `source` yang sama, lalu insert chunk baru (bisa "ganti-ganti" isi RAG dengan meng-upload ulang).
2. `src/rag/retrieve.ts` — `retrieve(query, limit=5)`:
   - Embed query → query similarity di `rag_documents` (`<=>`) → return `content` list.
3. `src/ai/chatHandler.ts` — UPDATE:
   - Pertama retrieve top-5 chunk relevan → sertakan sebagai konteks di pesan AI.
   - Tetap lewati guard dulu seperti Phase 2.
   - JANGAN ubah kontrak pemanggilan AI yang sudah ada (`askAI(config, messages)` → NVIDIA API, non-streaming, fetch native). Kalau perlu context tambahan, cukup tambahkan konten RAG ke array `messages` sebagai pesan `system`/`user` konteks.
4. `.env.example` tambah: `EMBEDDING_MODEL`, `EMBEDDING_API_KEY`, `EMBEDDING_BASE_URL`.

## Verifikasi
- Jalankan ingest pada PDF contoh (buat 1 PDF kecil berisi info cafe) → muncul di tabel `rag_documents`.
- Tanya bot: isi yang ada di PDF → jawaban memakai konteks RAG (bukan asumsi).
- Ganti isi PDF (re-ingest source sama) → jawaban ikut berubah (bukti bisa di-update).
```

---

### PHASE 4 — Prompt: Order via WhatsApp (dev: kata "bayar")

```
Tugasmu: tambahkan alur PEMESANAN via WhatsApp di `server/` (lanjutan Fase 2 AI + Fase 3 RAG). BELUM ada payment gateway: dev = customer cukup ketik "bayar" lalu pesanan masuk dashboard /admin sebagai PAID. Sumber harga DAN ketersediaan menu WAJIB dari database, jangan hardcode.

## Sumber data & constraints (WAJIB baca dulu)
- Baca `supabase/01_schema.sql` utuh. Poin yang menentukan desain order:
  - `orders.user_id` NOT NULL references `auth.users` → WhatsApp bukan user Supabase. Buat **1 akun bot** di Supabase Auth (dashboard, email/password) → catat `user_id` → taruh di env `WA_BOT_USER_ID`. Pakai sebagai `actor` di semua RPC create/update.
  - `orders.idempotency_key uuid` + `unique(user_id,idempotency_key)` → setiap sesi keranjang generate 1 UUID, dipakai ulang saat retry.
  - Semua tulis order lewat **RPC security definer** (GRANT-nya hanya ke `service_role`): `create_cafe_order(actor, request_key, customer, customer_phone, fulfillment_value, table_code, line_items)` dan `update_cafe_order(order_uuid, next_status, mark_paid)`. JANGAN insert ke tabel `orders`/`order_items` langsung.
  - `create_cafe_order` sudah menghitung total dari harga saat ini, memvalidasi `is_available`, meja `available`, format qty/notes, dan maks 5 pesanan/10 menit/aktor. `line_items` = array `{menuItemId, quantity, notes}`.
  - `payment_method` hanya menerima `'cod'` → JANGAN alter schema, bayar-nya cukup `update_cafe_order(order_uuid, mark_paid=true)` yang berisi `payment_status='paid'`.
  - `queue_number` dibuat otomatis (sequence `order_queue_seq`, grant service_role).
  - `orders.phone` regex `^[0-9]{8,15}$`, `customer_name` 2–80 char → validasi di sisi bot sebelum panggil RPC.
- Menu dibaca dari view langsung `public.menu_items` (pilih `id`, `data->>'name'` as name, `data->>'price'` as price, `is_available`, `data->>'category'`). Client: `src/supabase/client.ts` (`createServiceRoleClient`) + `src/config/env.ts` (`getSupabaseConfig`) yang sudah ada dari Fase 3.
- Session keranjang: **in-memory Map keyed `message.from`** (tidak perlu DB). Timeout sesi ~10 menit; keyword `batal`/`cancel` mereset sesi ke langkah awal.

## Alur implementasi
Kalau user mengetik intent order ("pesan", "order", "beli", "mau pesan", dst., case-insensitive) → MASUK ke order flow, selainnya tetap `handleChat` (Fase 2–3 tidak berubah). Urutan dialog:

1. Bot sapa + tanya mau pesan apa. User jawab item bebas format menambah ke keranjang, mis: `2 americano`, `1 es kopi susu + 1 nasi goreng`, `kopi susu 1, teh 2`. Parsing: cari item di `menu_items` berdasarkan nama (lowercase, contains/fallback like). Hasil unik → masukkan keranjang. Banyak kecocokan → balas daftar kandidat + minta user pilih. Item habis (`is_available=false`) → tolak ramah. Qty default 1; validasi 1–20.
2. Setelah ada item (atau user ketik `selesai`/`jadi`): tanya **dine-in / takeaway** (`dine in`/`take away`/`bawa pulang`). Jika dine-in → tanya nomor meja; tampilkan daftar meja `available` dari `cafe_tables` (label + floor). Kalau tidak ada meja kosong → saran takeaway.
3. Tanya **nama** → validasi 2–80 char. Tanya **nomor HP** → validasi `[0-9]{8,15}`.
4. Bot konfirmasi ringkasan: item + qty + total (jumlahkan dari price saat ini DI SISI BOT untuk display; nilai akhir tetap hasil RPC), fulfillment (+ meja), nama, HP. Lalu: "Untuk memproses pesanan, ketik `bayar` (mode development)." Ketik `bayar` →:
   - Generate `idempotency_key` (uuid, 1 per sesi) → `create_cafe_order(WA_BOT_USER_ID, key, nama, hp, fulfillment, table_code, line_items)`.
   - Lalu `update_cafe_order(order_uuid, null, true)` → tandai PAID.
   - Balas: nomor antrian (`queue_number`), total, ringkasan. Kosongkan keranjang untuk user.
5. Semua error validasi (menu habis, meja tidak tersedia, format salah, error RPC mis. "Terlalu banyak pesanan"/"Meja tidak tersedia") → balas pesan ramah, kembalikan user ke langkah yang relevan, JANGAN crash dan JANGAN buat order parsial.
6. Idempotensi: kalau RPC panggilan ulang (network/timeout setelah insert) dengan `request_key` yang sama di-create ulang, `create_cafe_order` mengembalikan pesanan yang sama → balas ringkasan itu, tidak buat duplikat.

## File
- Buat `server/src/order/orderFlow.ts` (state machine + parsing + render balasan) dan `server/src/order/intent.ts` (deteksi intent order vs pertanyaan biasa). Pisahkan dari `src/ai/chatHandler.ts`.
- `src/index.ts`: sebelum `handleChat`, cek intent order → jalankan `orderFlow`. Tetap auto-reply "pong" untuk "ping" dan kontrak `askAI` TIDAK diubah.
- `src/config/env.ts`: `WA_BOT_USER_ID` sudah ada; untuk order gunakan `getSupabaseConfig` yang ada. Tambahkan fungsi `getBotUserId(env)` yang me-throw error jelas kalau belum diisi (ikuti pola lazy validation, jangan fail-fast saat startup).
- `server/package.json`: jangan tambah dependency baru kecuali benar-benar perlu (state machine cukup if/else, tidak perlu library).

## Pengujian
- Chat "pesan" → seluruh alur sampai "bayar" → cek dashboard `/admin` (kanban Pesanan): pesanan muncul dengan status **paid**, queue_number terisi, item & total benar.
- Toggle `is_available=false` untuk satu item → bot menolak item tersebut saat ditambahkan.
- Dine-in dengan meja yang sedang `occupied`/`dirty` → bot tolak + saran takeaway.
- Kirim ulang `bayar` (retry) → tidak membuat duplikat pesanan (idempotency key).
- Pesan di luar topik (mis. "nanya PR matematika") → tetap dijawab `handleChat`/guard seperti biasa, tetap lewat jalur AI.

## Verifikasi build
`npm run build` di `server/` → 0 error sebelum dianggap selesai.

## Catatan
- `payment_method` tetap `'cod'` (dev). Penggantian ke iPaymu QRIS murni fase FUTURE (`ipaymu.md`), TIDAK diimplementasikan sekarang.
- Jangan tulis data order kecuali lewat RPC di atas; jangan pakai anon key dari server.
```

---

### PHASE 5 — Prompt: Ops / Produksi (stabil 24/7 di VPS)

```
Tugasmu: polish bot `server/` agar stabil jalan 24/7 di VPS (target Oracle Cloud Always Free Ubuntu). Fokus: anti-spam, reconnect yang benar, shutdown bersih, logging, dan deploy PM2 yang idempotent setelah reboot.

## Kondisi kode SEKARANG (baca dulu, jangan asumsi)
- `src/whatsapp/client.ts` SUDAH punya: listener `qr`, `authenticated`, `auth_failure`, `ready`, `disconnected`, `message`, dan reconnect backoff 8x (5s → 5 menit, reset di `ready`). PERTAHANKAN struktur ini, jangan rombak dari nol.
- `src/whatsapp/logger.ts` SUDAH console log berformat `[ISO] [LEVEL] pesan {meta}`. Jangan ganti ke library logging baru.
- `src/index.ts` BELUM punya handler `ping` → `pong` (draft plan lama menuliskannya "sudah ada", tapi faktanya belum) — ini kerjaan nyata.
- `src/config/env.ts`: `loadEnv()` baca semua env saat start, tapi masing-masing config divalidasi LAZY (`getNemotronConfig`, `getEmbeddingConfig`, `getSupabaseConfig`) supaya bot tetap bisa jalan meski key belum diisi. JANGAN ubah ke fail-fast penuh — ini keputusan desain disengaja.
- Bot SKIP pesan: `status@broadcast`, `fromMe`, `isStatus`, grup, dan body kosong (di `index.ts`). Rate-limit hanya relevan untuk chat personal.

## Yang dikerjakan (lanjutkan pola file yang ada)
1. **Rate-limit anti-spam** — buat `src/queue/rateLimit.ts`:
   - Sliding window in-memory per user (`message.from`): maks `RATE_LIMIT_MAX_PER_MINUTE` pesan per `RATE_LIMIT_WINDOW_MS`.
   - Export `checkRateLimit(from): { allowed: boolean; waitMs: number }`.
   - Ditimpa batas → bot DIAM (jangan balas apa-apa; pas bandwith ke pelanggan, bukan rate-limit yang meng-install hukuman publik) — tapi log di logger. Dokumentasikan. Kalau dianggap terlalu agresif, bisa juga balas pesan pelan (delay) — pilih yang lebih sederhana, tulis di comment.
   - Pasang di `index.ts` PALING ATAS `handleIncomingMessage`, sebelum routing order/AI.
   - Tambah env optional `RATE_LIMIT_MAX_PER_MINUTE` (default 5) & `RATE_LIMIT_WINDOW_MS` (default 60_000) di `loadEnv()` (optional, bukan readRequired).

2. **Reconnect strategy — perbaiki yang sudah ada, jangan buat ulang** (`src/whatsapp/client.ts`):
   - `auth_failure` (mis. database session korup / logout) JANGAN auto-reconnect loop. Log jelas "Perlu scan ulang QR" + STOP. Di task pelaksana bisa flag bahwa `auth_failure` menandakan sesi tidak valid.
   - Tambah graceful shutdown: di `index.ts` (atau file baru `src/whatsapp/shutdown.ts`) pasang `process.on("SIGINT"|"SIGTERM")` → `client.destroy()`, bersihkan reconnect timer, log "shutdown bersih", `process.exit(0)`.
   - **Bug orphan Chromium** (diketahui): kalau bot mati mendadak, proses chrome lama masih memegang `server/session/` → error startup "The browser is already running for ...\session". Solusi yang disukai: graceful shutdown di atas menutup browser dengan benar; tambahan, sebelum `initialize()` saat start, beri log yang jelas kalau `destroy()` tidak sempat dijalankan (deteksi bisa lewat error). JANGAN menambah library baru untuk ini.
   - Pertahankan backoff 8x max 5 menit & reset di `ready`.

3. **Logging** (`src/whatsapp/logger.ts`):
   - Tambahkan env optional `LOG_LEVEL` (info/warn/error, default info) → `warn`/`error` difilter di bawah level.
   - JANGAN log `body` pesan yang mengandung data pribadi di level info (nomor/email) — cukup `from` (hash) + karakter pertama/panjang. Sudah ada `body` di `index.ts` log pesan masuk — sanitasi atau anonimkan.
   - Jika memungkinkan, `meta` tiap baris sudah punya `timestamp` di prefix — tidak perlu diulang di meta.

4. **Health check** (`src/index.ts`):
   - Tambah handler "ping" → "pong" (case-insensitive, tanpa variasi, cukup kata "ping") untuk chat personal, SEBELUM guard. Log uptime di event `ready` pakai `process.uptime()`.
   - Harus tetap berjalan saat AI/order tidak dikonfigurasi (pesan ping tidak boleh kena guard/AI).

5. **Deploy VPS + PM2**:
   - Tulis `server/DEPLOY.md` langkah nyata (Oracle Cloud Ubuntu):
     - `git clone`, `npm ci`, `npm run build`
     - Install Chromium: `sudo apt update && sudo apt install -y chromium-browser` → set `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` di `.env`. Kalau pakai Chrome: `/usr/bin/google-chrome`.
     - Backup `server/session/` sebelum migrate; JANGAN commit folder session.
     - Buat `.env` dari `.env.example` (WA_BOT_PHONE, NVIDIA_API_KEY/MODEL, SUPABASE_*, WA_BOT_USER_ID, EMBEDDING_*, PUPPETEER_EXECUTABLE_PATH). JANGAN commit.
     - PM2: buat `server/ecosystem.config.js` → `apps[0]` { name: 'cafesite-wa-bot', script: 'dist/index.js', cwd: 'server', env: isi dari .env, max_memory_restart: '300M', kill_timeout: 3000, restart_delay: 3000, autorestart: true }.
     - Jalankan: `pm2 start ecosystem.config.js && pm2 save`, lalu `pm2 startup` (perintah output diikuti persis) supaya idempotent after reboot.
     - Verifikasi log via `pm2 logs cafesite-wa-bot`.
   - Session WhatsApp mobile TETAP berlaku di PM2 selama folder `session` dibackup & dipindah utuh — tulis di DEPLOY.md.

## Pengujian
- `npm run build` di `server/` → 0 error.
- Simulasikan disconnect (matikan internet laptop / `kill` proses chrome orphan) → bot reconnect sendiri dalam batas backoff.
- Spam > N pesan dalam 1 menit → bot diam (tidak ada balasan), log rate-limit tercatat.
- Test "ping" → "pong" walau NVIDIA_API_KEY kosong.
- Deploy ke VPS → `pm2 status` online; `sudo reboot` → bot kembali online tanpa langkah manual (PM2 startup).
- Pastikan tidak ada duplikasi handler / event listener yang terpasang dua kali ketika start ulang.

## Catatan
- Jangan tambah dependency baru (rate-limit cukup Map + Date.now; anti-spam tidak perlu redis).
- Jangan sentuh kontrak `askAI`, `handleChat`, alur order (Fase 4), dan RAG (Fase 3).
- Kalau ada keputusan (mis. jumlah rate-limit, panjang window), tulis jelas di comment + doc, bukan dibahas di runtime.
```

---

### PHASE 6 — Prompt: Panel "WhatsApp Bot" di Dashboard Admin (Upload PDF → RAG)

> Scope sudah diminta eksplisit oleh user (bagian dari dashboard admin, bukan lagi ❌). Fokus utama: admin bisa **upload PDF di web dashboard** → diproses di `server/` bot menjadi RAG untuk AI WhatsApp.

```
Tugasmu: tambahkan modul baru **"WhatsApp Bot"** di dashboard admin website (Next.js, folder `src/`) + worker di bot (`server/`) agar PDF yang di-upload admin otomatis jadi RAG yang dipakai AI WhatsApp. Lapisan website dan bot tetap terpisah: website cuma menerima file & menunjukkan status, proses chunk+embed WAJIB di `server/` (yang punya EMBEDDING_* config).

## Prasyarat — baca & ikuti pola existing dulu
- `src/components/admin/AdminDashboard.tsx`: daftar nav modul + render komponen per modul.
- `src/components/admin/admin-api.ts`: helper `adminRequest` (route `/api/admin/...`, bearer token, JSON).
- `src/components/admin/MenuFormModal.tsx`: pola upload ke Supabase Storage (`client.storage.from("cafe-assets").upload(...)` + `getPublicUrl`).
- `src/app/api/admin/manage/route.ts` + `src/lib/server/api.ts` (`authorizeStaff`, `dbError`): pola route admin, semua tulis lewat `service_role` dari server Next.js.
- `src/types/admin.ts`: union `AdminModule` — tambah nilai `"wa_bot"`.
- `supabase/01_schema.sql`: check constraint `staff_modules.id` (daftar id tertutup) — perlu alter.
- `supabase/04_rag_documents.sql`: tabel `rag_documents` + RPC `match_rag_documents`. Embedding = `nvidia/nemotron-3-embed-1b`, dimensi **2048**, kolom `halfvec(2048)` (Wajib, jangan `vector`/angka lain).
- `server/src/rag/ingest.ts`, `chunk.ts`, `embed.ts`, `server/src/supabase/client.ts`: alur ingest yang sudah berjalan (CLI). Proses yang sama HARUS dipakai ulang oleh worker baru, jangan duplikasi logika.

## Alur yang dibangun (queue lewat Supabase, bukan trigger DB)

1. **Schema baru** (`supabase/06_wa_bot_dashboard.sql`, idempotent, jangan rusak file lain):
   - `alter table public.staff_modules drop constraint staff_modules_id_check;` lalu `add constraint ... check (id in (...,'wa_bot'))` (tombstone semua id lama + `'wa_bot'`).
   - Tabel antrian: `public.rag_ingest_jobs` (id uuid pk default gen_random_uuid(), `file_path text not null` [path storage], `source text not null` [nama pdf], `status text not null default 'pending' check (status in ('pending','processing','done','failed'))`, `error text`, `created_at`, `updated_at`).
   - Storage bucket baru `wa-bot-rag` (bukan cafe-assets): `public=true`, `file_size_limit` ~10MB, `allowed_mime_types = array['application/pdf']`.
   - RLS: `rag_ingest_jobs` select untuk `authenticated` via `can_module('wa_bot')`, insert/update dari website dan bot semua lewat `service_role`; `rag_documents` tetap seperti di 04 (SELECT anon/authed, tulis hanya service_role). Grant sesuai pola file 01 (revoke anon/authed dari tulis).
   - Policy storage `wa-bot-rag`: read `anon,authenticated`; insert/update/delete `authenticated with check ((public.can_module('wa_bot')) and bucket_id='wa-bot-rag')`.

2. **Website (Next.js)**:
   - `src/types/admin.ts`: `AdminModule` tambah `"wa_bot"`.
   - `AdminDashboard.tsx`: tambah nav item `{ id: "wa_bot", label: "WhatsApp Bot", caption: "Dokumen RAG & status asisten WhatsApp." }` ke grup "Operasional"; render komponen baru seperti pola modul lain.
   - Komponen baru `src/components/admin/WaBotManager.tsx`:
     - Upload area: `<input type="file" accept="application/pdf">` + drag&drop opsional. Simpan nama file dibersihkan (`lowercase`, spasi→`-`), path unik `rag/<timestamp>-<safeName>.pdf` (ikuti pola nama random/no-overwrite MenuFormModal).
     - Setelah upload: `adminRequest` POST `/api/admin/wabot` → insert `rag_ingest_jobs` (status `pending`, `file_path`, `source`). Tampilkan pesan "PDF diterima, sedang diproses asisten bot…".
     - Daftar dokumen: tabel job (file, status badge pending/process/done/failed, error jika failed, waktu) + ikon status. Muat ulang via polling ringan (mis. `setInterval` 5 detik saat halaman terbuka) ATAU Supabase Realtime `postgres_changes` pada `rag_ingest_jobs` (lihat pola Channel di AdminDashboard) — pilih yang paling sederhana, tulis konsisten.
     - Tombol "Proses ulang" (reset job `done/failed` → `pending`) dan "Hapus" (hapus file storage + hapus attempt `source` dari `rag_ingest_jobs` + DELETE chunk `rag_documents where source=...` via route admin). Delete harus idempotent (file/chunk mungkin sudah tidak ada).
     - Catatan teks di atas daftar: "PDF di sini jadi sumber pengetahuan asisten WhatsApp. Re-upload nama yang sama akan mengganti isi."
   - API route baru `src/app/api/admin/wabot/route.ts` (GET=list jobs, POST=insert job+bucket check, DELETE=hapus):
     - Pakai `authorizeStaff(request, permission)` dengan `permission` dari modul `wa_bot` (ikuti pola manage/route.ts - revoke anon/authed dari tulis).
     - Semua tulis via `getServiceSupabase()` (service_role). Validasi input ketat: `source` ≤80 char, `file_path` whitelist hanya prefix `rag/` + akhiran `.pdf`, jangan percaya nama dari client mentah-mentah.
     - Upload file dilakukan dari sisi CLIENT (`MenuFormModal` pattern) lalu role bot melakukan insert job — atau upload langsung di route jika mengikuti pola server-upload Next.js; konsisten dengan favorit yang ada, WAJIB validasi mime/pdf magic bytes di server (client hanya menyarankan `file.type`).

3. **Bot (`server/`)**:
   - Refactor kecil di `server/src/rag/`: tarik fungsi `extractPdfText`, `chunkText`, `embed` menjadi dipakai bersama oleh CLI `ingest.ts` dan worker baru (`rag/workers.ts` atau `rag/watch.ts`) supaya tidak ada 2 alur berbeda.
   - Worker baru `server/src/rag/watch.ts`: script `npm run rag:watch` (pakai `tsx`):
     - Bergulir forever dengan interval (default ~15 detik, env optional `RAG_POLL_MS`): ambil job `status=pending` (order `created_at asc`, limit mis. 5, stable). Set `status=processing` + `processing_by`/`started_at` (tambah kolom kalau perlu di 06).
     - Download PDF dari storage: `client.storage.from("wa-bot-rag").download(file_path)` → buffer → `extractPdfText` → `chunkText` → `embed(...,"passage")`.
     - Tulis ke `rag_documents`: HAPUS dulu chunk lama `where source=<source>` lalu insert (pola sama like CLI). Update job `status=done`, `error=null`.
     - Kegagalan di row manapun → update job `status=failed` + `error=<message>` (skip, jangan terminasi worker). Kegagalan download storage sementara boleh dicoba ulang **1x** sebelum dianggap failed.
     - Konkurensi: cukup 1 worker process; pakai `pg_advisory_lock(hashtextextended(id::text,0))` per job, atau ambil dengan `update ... returning` untuk mengunci — konsisten, dokumentasikan pilihan.
   - Jangan ubah kontrak `askAI`, `handleChat`, `retrieve`, RPC `match_rag_documents`. `rag_documents` tetap hanya ditulis service_role dari bot.

## Verifikasi
- Di dashboard: upload `menu-info.pdf` → muncul di daftar, job `pending` → beberapa detik kemudian `done`. Ada file di Storage `wa-bot-rag/rag/...`.
- Chat bot: "menu apa saja yang ada?" → jawaban memakai isi PDF (bukan asumsi). Re-upload PDF sama nama dengan isi berubah → jawaban ikut berubah (chunk lama dihapus).
- Hapus PDF di dashboard → chunk `rag_documents` untuk `source` itu hilang, job hilang.
- Upload file non-PDF / >10MB → ditolak ramah, tidak ada job dibuat.
- User non-staff tanpa modul `wa_bot` → tidak melihat menu di nav & API menolak (403).
- `npm run build` di root (Next.js) dan `server/` → 0 error sebelum dianggap selesai.

## Catatan
- Tidak menambah dependency berat: parsing PDF tetap `pdf-parse` (sudah di server bot). Di Next.js TIDAK perlu install parser — parse terjadi di worker bot.
- Jangan menyimpan / merefresh credential embedding di folder website; yang menyentuh NVIDIA API tetap `server/`.
- Ini penambahan modul dashboard (bukan fitur Phase 2 berbayar yang lain) — sebatas modul WhatsApp Bot saja.
```

---

## 5. Setelah Semua Phase Fix — FUTURE (BUKAN bagian sekarang)

- Ganti keyword `bayar` → integrasi **iPaymu QRIS** sesuai `ipaymu.md` (endpoint direct payment qris, callback verifikasi, signature).
- Upload PDF RAG dari website (alur admin panel) — PDF masuk Supabase Storage → server ingest otomatis via trigger/webhook.
- Evaluasi embed model (biaya) dan apakah Nemotron Lightning tetap paling cepat/hemat.

---

## 6. Checklist Per Phase

- [ ] P1: bot login + ping/pong + auto-reconnect
- [x] P2: AI Nemotron (NVIDIA API) + guard topik
- [x] P3: RAG (pgvector) upload → chunk → embed → retrieve → jawab kontekstual
  - Kode: `server/src/rag/` (embed.ts, chunk.ts, ingest.ts, retrieve.ts) + `server/src/supabase/client.ts`
  - SQL: `supabase/04_rag_documents.sql` (tabel `rag_documents`, HNSW index, RLS, RPC `match_rag_documents`)
  - CLI: `npm run rag:ingest <path.pdf>` di `server/`
- [ ] P4: order WA (dev `bayar`) masuk dashboard paid
- [ ] P5: rate-limit + PM2 + deploy VPS + recovery

---

## 7. Log Keputusan (isi saat phase berjalan)

| Tanggal | Keputusan | Alasan |
|---|---|---|
| (isi) | Provider AI: NVIDIA API langsung (`integrate.api.nvidia.com`), bukan OpenRouter | Sudah diimplementasikan di Phase 2; endpoint OpenAI-compatible, non-streaming, fetch native, tanpa HTTP-Referer/X-Title |
| (isi) | Model ID: `nvidia/nemotron-3.5-lightning-30b-a3b` via env `NVIDIA_MODEL` | ID resmi NVIDIA API (bukan ID OpenRouter); key `nvapi-...` di `NVIDIA_API_KEY` |
| (isi) | RAG di Supabase + pgvector | Sudah ada project Supabase untuk dashboard |
| (isi) | Embedding model: NVIDIA `nvidia/nv-embedqa-e5-v5` (dimensi 1024) via `integrate.api.nvidia.com/v1/embeddings` | Satu ecosystem dengan chat (pakai `NVIDIA_API_KEY` yang sama); embed diimplementasikan pada Phase 3, bukan OpenAI agar tidak perlu API key terpisah |
| (isi) | (dsb.) | |