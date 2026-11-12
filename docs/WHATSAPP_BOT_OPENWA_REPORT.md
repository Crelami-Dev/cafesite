# Bot WhatsApp CafeSite — Laporan Teknis (OpenWA + SQLite)

Status: **berfungsi end-to-end tanpa Supabase.** Seluruh data (menu, meja, pesanan, dokumen pengetahuan, cache) ada di satu file SQLite. WhatsApp ditautkan lewat dashboard website. Yang belum teruji hanya pengiriman/penerimaan pesan WhatsApp sungguhan, karena itu butuh pemilik nomor memindai QR (lihat bagian 9).

---

## 1. Ringkasan

| Hal | Sekarang |
|---|---|
| Penyimpanan | **SQLite** `.data/cafesite.dev.db` (bawaan Node 22+, tanpa dependency baru), mode WAL |
| Supabase | **Tidak dipakai sama sekali.** Server dan browser sama-sama dimatikan kecuali `CONTENT_SOURCE=supabase` |
| Menautkan WhatsApp | Dashboard → Operasional → WhatsApp Bot → **Hubungkan WhatsApp** → pindai QR |
| Menu & harga | Dibaca langsung dari tabel menu (sama dengan dashboard), selalu terbaru |
| Pengetahuan tambahan | Unggah PDF/Markdown di dashboard; dipelajari bot dalam hitungan detik |
| AI | NVIDIA Nemotron bila kunci diisi; **tanpa kunci, bot tetap menjawab** dari menu dan dokumen |
| Pesanan | Alur WhatsApp → tabel `orders` → muncul di dashboard Pesanan (COD, bayar di kasir) |
| Tes otomatis | 93 tes lolos (`cd server && npm test`) |

---

## 2. Arsitektur

```
 Ponsel pelanggan ──WhatsApp──▶  server/ (proses bot, Node + OpenWA/Chromium)
                                   │  • penjaga pesan (halo bot, rate limit, anti-injeksi)
                                   │  • alur pesanan • tanya jawab (AI + data)
                                   │  • worker dokumen (RAG)  • API kontrol 127.0.0.1:8787
                                   ▼
                          .data/cafesite.dev.db  (SQLite, WAL)
                                   ▲
 Browser admin ──▶ Next.js dashboard ──(token privat, loopback)──▶ API kontrol bot
                   • login lokal (cookie bertanda tangan)
                   • /api/admin/*  baca/tulis SQLite yang sama
```

Dua proses, satu file database. Bot tidak pernah dipanggil langsung dari browser: dashboard meneruskan perintah dengan token yang hanya ada di server Next.js.

### Berkas penting

| Lokasi | Fungsi |
|---|---|
| `server/src/index.ts` | Merangkai semuanya, shutdown rapi, autostart |
| `server/src/bot.ts` | Otak bot (terpisah dari transport, mudah diuji) |
| `server/src/whatsapp/client.ts` | Runtime koneksi + driver OpenWA, reconnect, batalkan koneksi |
| `server/src/control/server.ts` | API kontrol privat untuk dashboard |
| `server/src/db/database.ts` | Skema SQLite dan transaksi |
| `server/src/order/*` | Menu, meja, alur pesan, pembuatan pesanan atomik |
| `server/src/rag/*` | Potong dokumen, embedding, pencarian hibrida, worker |
| `server/src/ai/*` | Penjaga topik, penyusun konteks, klien NVIDIA, cache jawaban |
| `src/components/admin/WaBotManager.tsx`, `WaConnectionPanel.tsx` | Panel dashboard |
| `src/app/api/admin/wabot/*` | Upload dokumen dan proxy kontrol bot |
| `src/lib/server/local-session.ts` | Sesi admin lokal bertanda tangan |

---

## 3. Yang diperbaiki dari versi sebelumnya

**Masalah yang ditemukan saat pemeriksaan:**

1. **Bot tidak bisa tersambung sama sekali di mesin ini.** OpenWA 5.x memuat paket `simple-zstd` yang menolak jalan bila program `zstd` tidak terpasang. Sekarang ditangani `whatsapp/openwaShim.ts` (fitur yang butuh zstd, sinkron sesi S3, memang tidak dipakai).
2. **Token kontrol di `.env.local` root dan `server/.env.local` berbeda**, jadi dashboard selalu gagal menghubungi bot. Sudah disamakan (nilai tidak ditampilkan).
3. **"Hubungkan" menggantung.** `connect` menunggu sampai QR dipindai (bisa berjam-jam), padahal dashboard menyerah dalam 8 detik. Sekarang koneksi berjalan di latar belakang dan QR muncul lewat polling status.
4. **"Putuskan" tidak memutuskan apa pun.** Kode memanggil `kill()` yang tidak ada di OpenWA 5.x. Sekarang memakai `stop()` plus pembersihan Chromium; terbukti Chrome 8 proses → 0 setelah "Batalkan".
5. **Pesan masuk dari diri sendiri dan grup bisa lolos.** Skema pesan OpenWA 5.x tidak punya `fromMe`; sekarang dibaca dari `self` dan akhiran `@g.us`.
6. **Cookie login lokal bisa dipalsukan.** Isinya hanya email. Sekarang `email.kedaluwarsa.tanda-tangan` (HMAC-SHA256, 8 jam); mengganti kata sandi mencabut semua sesi. Validasi Origin untuk metode yang mengubah data.
7. **Pesan konfirmasi pesanan berbohong.** Tertulis "Pembayaran berhasil" padahal COD belum dibayar. Sekarang "Pesanan diterima… bayar di kasir".
8. **Jawaban terlalu kaku.** Sapaan, terima kasih, dan menu ditolak "di luar topik"; tanpa dokumen bot selalu menjawab "belum tersedia". Sekarang menu, harga, dan fakta kafe selalu masuk konteks.

**Perubahan arsitektur:** semua akses Supabase di bot diganti SQLite (menu, meja, pesanan, RAG, cache, antrean dokumen). Upload dokumen tidak lagi lewat Supabase Storage tapi langsung ke tabel `rag_jobs`.

---

## 4. Menjalankan

Syarat: **Node 22.5+** (diuji di Node 24), Google Chrome atau Chromium.

```bash
# 1. Website (terminal 1)
npm run dev

# 2. Bot (terminal 2)
cd server
npm install
npm run dev
```

Konfigurasi minimal:

| File | Variabel |
|---|---|
| `.env.local` (root) | `CONTENT_SOURCE=sqlite`, `WA_BOT_CONTROL_URL=http://127.0.0.1:8787`, `WA_BOT_CONTROL_TOKEN` |
| `server/.env.local` | `BOT_CONTROL_TOKEN` (**harus sama** dengan `WA_BOT_CONTROL_TOKEN`, min. 16 karakter), `PUPPETEER_EXECUTABLE_PATH` (path Chrome) |
| Opsional | `NVIDIA_API_KEY`, `NVIDIA_MODEL` (jawaban AI); `EMBEDDING_API_KEY`, `EMBEDDING_MODEL`, `EMBEDDING_BASE_URL` (pencarian dokumen berbasis makna) |

Buat token acak: `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`.

Variabel Supabase di `.env.local` tidak lagi dibaca dan boleh dihapus.

---

## 5. Menautkan WhatsApp lewat dashboard

1. Masuk ke `/dashboard` → **Operasional → WhatsApp Bot**.
2. Tekan **Hubungkan WhatsApp**. Status: *Menyiapkan koneksi…* (±20–60 detik pertama kali).
3. QR muncul. Di ponsel: **WhatsApp → Perangkat tertaut → Tautkan perangkat** → arahkan ke QR. QR berganti sendiri; halaman memperbaruinya otomatis.
4. Status berubah **Terhubung** dan menampilkan nomor (disamarkan).

| Tombol | Efek |
|---|---|
| Batalkan | Berhenti menunggu QR dan menutup Chromium |
| Sambung ulang | Putus lalu sambung lagi; sesi tetap, tidak perlu scan |
| Putuskan sementara | Bot berhenti; sesi tersimpan |
| Keluar & ganti nomor | Menghapus sesi; nomor harus dipasangkan ulang |

Setelah pernah tersambung, bot **menyambung sendiri** saat dinyalakan ulang. Bila terputus tak sengaja, ia mencoba lagi dengan jeda 5 dtk → maks 5 menit.

---

## 6. Perilaku bot

- Chat pribadi **diabaikan** sampai pelanggan mengirim **`halo bot`**. Grup, status, dan pesan sendiri tidak pernah dijawab.
- Sesi 10 menit sejak pesan terakhir; pengingat di menit ke-8 (tidak memperpanjang). **`tutup bot`** mengakhiri; jawaban yang masih diproses dibuang.
- Maks. 5 pesan/menit per nomor; selebihnya diabaikan diam-diam (menghindari pola bot yang mencurigakan bagi WhatsApp). Pesan ber-ID sama dijawab sekali.
- Ditolak **tanpa memanggil AI**: upaya mengubah aturan/membocorkan prompt, permintaan resep/cara membuat, data pribadi pemilik-karyawan-pelanggan, dan topik di luar kafe. Sapaan dan terima kasih dijawab singkat.
- Jawaban dibuat dari tiga sumber: **menu live** (harga, status habis), **fakta kafe** (info kafe/FAQ/lokasi bila sudah diisi di dashboard — bot tidak mengarang jam buka atau alamat), dan **dokumen** yang diunggah.
- Tanpa kunci AI, atau saat AI gagal, bot menjawab dari data itu secara langsung (harga, daftar menu, kutipan dokumen).
- Jawaban AI disimpan 6 jam; otomatis tidak berlaku bila menu, fakta, atau dokumen berubah.

### Alur pesanan

`pesan` → sebut menu & jumlah (`2 americano, 1 nasi goreng`, `latte x2`) → `selesai` → *dine in* / *bawa pulang* → (kode meja) → nama → nomor (cukup `ya` untuk memakai nomor WhatsApp pengirim) → ringkasan → **`konfirmasi`**. `menu` menampilkan daftar, `batal` membatalkan.

Pembuatan pesanan atomik dan aman ulang: harga & ketersediaan **dibaca ulang dari database** saat konfirmasi (bukan dari keranjang), meja harus kosong lalu otomatis *terisi*, kunci idempotensi mencegah pesanan ganda, maks. 5 pesanan/10 menit/nomor, nomor antrian berurutan. Pesanan langsung tampil di dashboard (diperbarui tiap 5 detik) dan bisa diproses: menunggu → disiapkan → siap → selesai; meja menjadi *kotor* setelah selesai.

---

## 7. Dokumen pengetahuan (RAG)

- Unggah **PDF atau Markdown** (≤ 10 MB, harus berisi teks, bukan hasil scan) lewat dashboard; seret-letak didukung. Isi file diperiksa (tanda `%PDF-`, tidak kosong), bukan hanya ekstensinya.
- Worker di proses bot mengambil antrean tiap 3 detik: ekstrak → potong (±700 karakter, tumpang tindih 80) → embedding → simpan. Status: Menunggu → Diproses → Selesai/Gagal; pesan gagal ditulis jelas, rincian teknis hanya di log.
- Unggah ulang nama sama **menggantikan** isi lama secara atomik. Hapus membuang dokumen dan pengetahuannya; dokumen yang dihapus saat sedang diproses tidak hidup kembali. Job `Diproses` yang macet >10 menit (bot mati) dikembalikan ke antrean.
- Pencarian dijelaskan di bagian 13 (BM25 + stemmer Indonesia + sinonim + embedding opsional).
- Via terminal: `cd server && npm run rag:ingest docs/contoh-cafesite.pdf`.

---

## 8. API kontrol bot (internal)

Wajib header `Authorization: Bearer <token>` (dibandingkan *timing-safe*). Dengarkan hanya `127.0.0.1`.

| Endpoint | Fungsi |
|---|---|
| `GET /internal/control/status` | Status, nomor tersamar, QR bila ada, statistik, mode AI/embedding |
| `GET /internal/control/qr` | QR pairing (hanya saat `awaiting_qr`) |
| `POST /internal/control/connect` · `restart` · `disconnect` · `logout` | Seperti tombol dashboard |

Status: `stopped`, `connecting`, `awaiting_qr`, `connected`, `reconnecting`, `error`.

### Skema SQLite (ringkas)

`menu_items`, `content` (info kafe/FAQ/lokasi/galeri), `floors`, `cafe_tables`, `orders`, `order_items`, `rag_jobs` (file disimpan sebagai BLOB), `rag_chunks` (teks + vektor), `answer_cache`. DDL ada di `server/src/db/database.ts` dan salinan identik di `src/lib/db/dev-sqlite.ts`; tes `schema-sync` memastikan keduanya tidak menyimpang.

---

## 9. Hasil pengujian

**Otomatis — 93 tes lolos** (`cd server && npm test`, ±2 detik): parsing keranjang, pembuatan pesanan (harga dari DB, idempotensi, rollback, meja, batas), percakapan pesanan lengkap, RAG (chunk, hibrida, fallback, ganti, hapus saat diproses, job macet, **PDF nyata**), penjaga/AI/cache, runtime koneksi (QR → tersambung, batal, gagal, putus), API kontrol (token, semua endpoint), otak bot (aktivasi, grup, rate limit, duplikat, pesanan sampai tersimpan), sinkron skema. `tsc` dan `eslint` bersih di root dan `server/`.

**Langsung (live) terhadap sistem nyata:**

- OpenWA benar-benar menghasilkan **QR asli** (±24 dtk) lewat API kontrol **dan** lewat dashboard; Batalkan → Chrome 8 → 0; sambung-batal diulang 2× tanpa kebocoran.
- Dashboard: login benar/salah, **cookie palsu ditolak**, Origin asing ditolak (403), dashboard & `/dashboard` tanpa login dialihkan ke `/auth`.
- Unggah `.md` → bot memproses → *Selesai*; PDF palsu dan `.exe` ditolak; hapus dokumen membersihkan potongan dan cache.
- **NVIDIA nyata:** embedding hibrida menemukan potongan yang tepat; jawaban AI berdasar dokumen (±1,8 dtk); permintaan kedua dari cache (1 ms).
- Pesanan: muncul di dashboard, urutan status ditolak bila melompat, selesai tanpa bayar ditolak, lunas+selesai berhasil, meja menjadi kotor, hapus meja yang punya pesanan ditolak (409). Data uji dibersihkan.

**Belum teruji — perlu dilakukan pemilik nomor:**

1. Memindai QR dengan ponsel sungguhan lalu status **Terhubung**.
2. Mengirim `halo bot` dari ponsel lain dan membaca balasan (format pesan `id/from/body` dibaca dari tipe pustaka, belum dari pesan nyata).
3. Pulihnya sesi setelah restart bot, dan "Keluar & ganti nomor" (mengosongkan folder `server/session/`; periksa bahwa perangkat tertaut di ponsel benar-benar lepas, lalu pasangkan ulang).
4. `next build` produksi (server dev sedang berjalan sehingga build tidak dijalankan; dev, `tsc`, `eslint` lolos).
5. PDF hasil scan (tanpa teks) — sengaja ditolak, butuh OCR bila diperlukan.

---

## 10. Keamanan & operasional

- Biarkan API kontrol di `127.0.0.1`. Rotasi `BOT_CONTROL_TOKEN` dan kunci NVIDIA bila bocor.
- Folder `server/session/` = akses penuh ke akun WhatsApp; jangan di-commit (sudah di `.gitignore`), cadangkan seperti rahasia.
- `.data/` berisi pesanan, nama, dan nomor pelanggan; sudah di `.gitignore`. Cadangkan dengan menyalin file saat bot dan website berhenti (atau `sqlite3 .backup`).
- OpenWA tidak resmi: ada risiko nomor dibatasi WhatsApp. Jangan kirim massal; bot hanya membalas pesan masuk.
- Jalankan **satu** proses bot. Pelanggan tidak bisa menimpa harga: server menghitung ulang dari menu.
- Log tidak memuat isi pesan, hanya panjang; nomor di-hash.

---

## 11. Pemecahan masalah

| Gejala | Penyebab / solusi |
|---|---|
| Dashboard: *Server bot belum berjalan* | Jalankan `cd server && npm run dev` |
| Dashboard: *Token kontrol tidak cocok* | Samakan `WA_BOT_CONTROL_TOKEN` dan `BOT_CONTROL_TOKEN` |
| Bot langsung keluar: *Port 8787 sudah dipakai* | Ada bot lama; hentikan dengan `Ctrl+C` di terminalnya lalu jalankan lagi |
| Status *Gagal terhubung* | Baca pesan di bawah status; biasanya path Chrome salah (`PUPPETEER_EXECUTABLE_PATH`) |
| QR tak muncul >2 menit | Tekan Batalkan lalu Hubungkan lagi; cek log bot |
| Dokumen *Gagal* | PDF scan/kosong atau rusak; ekspor ulang dengan teks atau pakai `.md` |
| Bot tidak membalas | Pelanggan belum mengirim `halo bot`, sesi >10 menit, atau terkena rate limit |
| Pesanan WA tak muncul | Pastikan bot dan website memakai file yang sama (`DB_PATH` bot = `.data/cafesite.dev.db`) |

---

## 12. Batasan dan langkah berikut

- Halaman pesan **web** publik (`/order`) masih membutuhkan backend pesanan sendiri; kini tidak aktif karena Supabase dimatikan. Pesanan lewat WhatsApp dan input kasir di dashboard berfungsi. Portabel dengan menambahkan route yang memakai `createCafeOrder` yang sama.
- Berkas `supabase/*.sql` dan dokumen lama (`SETUP_WA_BOT_DASHBOARD.md`, `WA_BOT_PLAN.md`) tidak lagi relevan untuk bot; disimpan sebagai arsip bila kelak migrasi ke Postgres.
- Unggah foto menu mode lokal disimpan di `public/uploads/menu/` (diabaikan git); untuk produksi perlu penyimpanan objek.
- Beberapa modul dashboard (laporan, akses tim) belum punya data di mode lokal.
- Pengembangan lanjutan yang masuk akal: tombol "kirim pesan tes", riwayat percakapan opsional (saat ini sengaja tidak disimpan), notifikasi WhatsApp saat status pesanan berubah.

---

## 13. Pembaruan: RAG yang lebih akurat, gaya jawaban, dan login yang bertahan

### RAG
| Lapisan | Sebelumnya | Sekarang |
|---|---|---|
| Pemotongan | Per ±700 karakter tanpa konteks | Per **bagian berjudul** (`#`, `Judul:`, HURUF BESAR); tiap potongan diberi label `[Bagian > Subbagian]`; footer halaman (`-- 1 of 2 --`) dibuang |
| Kata | Pencocokan kata persis | **Stemmer Indonesia** (parkiran→parkir, pembayarannya→bayar) + normalisasi (rame→ramai, brp→berapa) |
| Bahasa gaul | Tidak dipahami | **Ekspansi sinonim** domain kafe: anabul→hewan peliharaan, gopay/ovo→QRIS, WC→toilet, nugas/charger→colokan, delivery→GoFood, ultah/arisan→acara, tanpa daging→vegan |
| Peringkat | TF-IDF ringan | **BM25** + bonus bila kata cocok dengan judul bagian; bila embedding ada, digabung dengan **Reciprocal Rank Fusion** |
| Relevansi | Satu kata umum cukup | Pertanyaan panjang harus **tercakup maknanya** ("harga bitcoin hari ini" tidak lagi cocok hanya karena kata "harga") |
| Percakapan | Tiap pesan berdiri sendiri | **Ingatan 6 pesan / 10 menit** per chat (hanya di memori, hilang saat sesi ditutup); "kalau hari minggu?" dicari bersama pertanyaan sebelumnya dan tidak ditolak penjaga topik |
| Tanpa dasar data | AI tetap dipanggil | Bot menjawab *belum tersedia* **tanpa memanggil AI** (hemat dan tidak mengarang) |

**Diukur** dengan dokumen contoh 18 topik (`server/tests/fixtures/kedai.md`) dan pertanyaan gaya pelanggan, tanpa API embedding sama sekali:

| Set | Lama | Baru |
|---|---|---|
| 34 pertanyaan (24 mirip dokumen + 14 gaul/parafrase), jawaban benar di posisi 1 | 24/34 (71%) | **34/34** |
| 12 pertanyaan **held-out** (ditulis setelah penyetelan, tidak dipakai menyetel) | 9/12 (75%) | **12/12** |

Catatan jujur: sinonim ditulis oleh saya, jadi set 34 cenderung optimis; angka held-out lebih mewakili tetapi tetap kecil dan dokumennya sintetis. Pertanyaan gaul baru yang belum ada di daftar sinonim mengandalkan embedding (bila kunci diisi). Tambah sinonim di `server/src/rag/text.ts`. Tes `tests/rag-quality.test.ts` menjaga ambang (≥95% dan ≥90%).

**Cache jawaban AI dihapus otomatis** setiap dokumen diunggah, diganti, diproses ulang, atau dihapus, sehingga jawaban berikutnya dibuat dari pengetahuan terbaru. Cache juga tidak berlaku bila menu, fakta kafe, atau dokumen berubah, dan jawaban yang bergantung pada percakapan tidak pernah disimpan untuk dipakai orang lain. Dokumen lama otomatis **diindeks ulang** sekali saat bot dinyalakan setelah pembaruan ini (`RAG_INDEX_VERSION`).

### Gaya jawaban
Singkat (1–3 kalimat), langsung ke inti, hangat dengan satu emoji pas, tanpa basa-basi pembuka. Penjelasan kopi/menu boleh lebih panjang (± 5 kalimat) dan mengundang. Ajakan *"Mau pesan? Ketik pesan ☕"* hanya muncul pada pertanyaan menu/rekomendasi/harga, tidak pada jam buka atau aturan. Prompt memuat **kamus dasar kopi** (espresso, latte, cappuccino, macchiato, cold brew, arabika/robusta) agar penjelasan akurat; pada uji awal AI sempat menyebut "bubur kopi" untuk busa susu, dan itu hilang setelah kamus ditambahkan. Contoh nyata: *"Latte ada banyak susu, busa tipis, rasanya lembut dan creamy. Cappuccino… rasanya kopi lebih terasa. Mau cobain? Ketik pesan ☕"*.

### Login WhatsApp yang bertahan
Temuan: OpenWA 5.10 mengabaikan opsi profil Chrome permanen, jadi login hanya tersimpan di `server/session/<id>.data.json`. Berkas itu **terkikis** (118 KB → 10 byte) ketika bot dimatikan paksa saat Chrome-nya masih hidup, hal yang sering terjadi dengan `tsx watch`. Akibatnya bot meminta QR lagi. Pengaman baru:

1. **Cadangan sesi otomatis** (`.data.json.bak`) tiap 5 menit dan saat tersambung, hanya bila isinya sehat (≥ 2 KB); cadangan baik tidak pernah ditimpa berkas kosong.
2. **Pemulihan otomatis** bila berkas sesi kosong saat bot dinyalakan.
3. **Chrome sisa** dari proses bot sebelumnya dimatikan saat start (PID dicatat di `browser.pids`, hanya proses Chrome yang dimatikan).
4. `npm run dev` kini **tanpa watch** agar bot tidak ikut mati setiap file diedit; pakai `npm run dev:watch` hanya saat mengembangkan kode bot. Produksi: `npm run build && npm start` (PM2).

Belum teruji pada sesi sungguhan: sesi Anda yang lama sudah terkikis sebelum pengaman ini ada, jadi **perlu scan QR satu kali lagi**. Setelah Terhubung, hentikan bot dengan `Ctrl+C`, jalankan lagi, dan pastikan status kembali Terhubung tanpa QR. Bila tidak, kabari saya, karena berarti WhatsApp menolak sesi yang dipulihkan dan perlu pendekatan lain.

---

## 14. Pemesanan lewat chat: multi-menu, bisa diubah, dan diverifikasi

### Cara pelanggan memesan
| Pelanggan menulis | Hasil |
|---|---|
| `mau pesen dua americano, satu nasi goreng yang pedes` | Langsung tercatat (pesan pertama tidak lagi dibuang); angka bisa digit atau kata ("dua"); kata pengisi ("dong", "ya kak") diabaikan |
| `latte tanpa gula`, `americano (es sedikit)` | Catatan per item, ikut tersimpan ke database dan tampil di rincian pesanan dashboard |
| `americanno` (salah ketik) | Tetap dikenali |
| `tambah 1 cheesecake` · `kurangi americano 1` · `hapus latte` · `ganti americano jadi 3` · `latte jadi 3` · `kosongkan` · `keranjang` | Edit keranjang kapan saja, termasuk di tahap ringkasan |
| `menu`, `menu kopi`, `ada menu makanan?` | Daftar **langsung dari database**, per kategori, hanya yang tersedia (yang habis disebut di akhir); tanpa AI sehingga nama dan harga pasti sama dengan dashboard |
| `batal` | Membatalkan seluruh pesanan (hanya frasa utuh, jadi "batalin latte" hanya menghapus latte) |

Memulai pesanan tidak harus mengetik "pesan": `2 americano` atau `mau nasi goreng` sudah cukup, tetapi pertanyaan seperti `bisa pesan lewat gofood?` atau `harga americano?` tidak memulai pesanan.

### Pemeriksaan agar yang dipesan = yang tersimpan
1. Setiap perubahan dijawab dengan **keranjang lengkap + total** (dari harga database).
2. Sebelum menyimpan ada **ringkasan baca-ulang**: item, catatan, total, tipe (dine in / bawa pulang + meja), nama, HP, lalu *"Sudah benar? konfirmasi / ubah / batal"*. Pesanan **belum** masuk database sebelum konfirmasi.
3. Saat konfirmasi, keranjang **dicocokkan ulang dengan menu terkini**: item yang baru habis dikeluarkan, harga yang berubah diperbarui, dan pelanggan diberi tahu serta diminta konfirmasi lagi. Server juga menghitung ulang harga dari database saat menyimpan, jadi harga tidak bisa dipalsukan dari chat.
4. Balasan akhir dibuat dari **baris yang benar-benar tersimpan** (nomor antrian, item, total), bukan dari keranjang sesi.
5. Pesanan muncul di dashboard dalam ≤ 5 detik dengan tanda *via WhatsApp*; catatan item tampil di rincian.

### Peran AI (dan batasnya)
Parser biasa menangani sebagian besar kalimat. Kalimat bebas yang tidak terbaca (mis. "kentang goreng truffle", "yang gurih satu") dibantu AI yang hanya memetakan kata menjadi **id menu + jumlah**; harga, nama, dan ketersediaan tetap dari database. Aturan yang ditegakkan oleh kode (bukan oleh prompt):
- id yang tidak ada di database, menu habis, dan jumlah di luar 1–20 dibuang;
- **jumlah dari AI hanya dipercaya bila memang disebut pelanggan**, selain itu dianggap 1;
- AI langsung diterapkan **hanya bila yakin tinggi dan nama menunya benar-benar disebut pelanggan**; tetap diberi keterangan *"🤔 Saya mengartikan … sebagai … Kalau kurang tepat, ketik hapus …"*;
- tafsiran dari deskripsi/ciri saja ("yang manis", "yang gurih") **hanya usulan**: *"maksudmu Nasi Goreng? Balas ya"*, masuk keranjang hanya setelah dijawab ya;
- hapus/ubah jumlah **tidak pernah** diputuskan AI (tidak ada tebakan destruktif); suhu 0, dan JSON rusak dicoba ulang sekali.

Uji nyata dengan NVIDIA menunjukkan pentingnya aturan ini: sebelum ada, AI pernah memetakan "minuman dingin yang manis satu" ke **2x Americano** secara yakin. Sekarang kasus itu hanya menjadi pertanyaan balik. Kelemahan yang masih ada: AI sering kurang tepat pada ciri samar (mis. "pasta" disarankan Nasi Goreng, bukan Carbonara), tetapi karena selalu ditanyakan dulu, kesalahan itu tertangkap pelanggan sebelum tersimpan.

### Pengujian
93 tes lolos (25 di antaranya khusus pemesanan: multi-item, edit, catatan, typo, kata bilangan, validasi ulang harga/ketersediaan, semua jalur AI, dine-in, konfirmasi). Uji langsung dua ronde dengan AI sungguhan dan database nyata: percakapan lengkap → tersimpan (3 Americano + Nasi Goreng + catatan = Rp101.000) → tampil di dashboard dengan sumber *whatsapp*; data uji dihapus. Belum diuji: pesanan dine-in dengan meja nyata Anda (tabel meja di database masih kosong), dan percakapan lewat ponsel sungguhan.

---

## 15. Perbaikan dari percakapan WhatsApp nyata

Uji pertama lewat ponsel sungguhan (nomor kedua) berhasil menyimpan pesanan ke dashboard, tetapi transkripnya memperlihatkan banyak kelemahan. Seluruh percakapan itu kini menjadi tes regresi (`tests/conversation.test.ts`, dengan menu nyata kafe).

| Yang terjadi di chat | Penyebab | Sekarang |
|---|---|---|
| "Saya mau pesen bisa?" ditolak | Ejaan "pesen" + berbentuk pertanyaan | "mau/boleh/bisa + pesan/pesen" memulai pesanan; "bisa pesan lewat gofood?" tetap pertanyaan biasa |
| "Macha late", "karamel maciato" tersimpan sebagai catatan | Toleransi typo terlalu sempit | Typo dikenali per kata (panjang kata menentukan toleransi), dan sisa kata yang ternyata bagian nama menu tidak jadi catatan |
| "saya mau nasi goreng juga" ditebak AI menjadi 2 menu | "saya/mau/juga" tidak dibuang | Kata pengisi dibuang; AI hanya dipanggil bila kalimat terdengar seperti pesanan (ada angka, kata makanan/minuman, atau mirip menu) |
| "Makan sini" → "semua meja terisi" | Kafe belum mengatur meja | Bila tidak ada meja di dashboard: makan di tempat tanpa nomor meja ("diarahkan kasir"); bila meja ada tapi penuh: tawaran bawa pulang yang dijawab "ya/yaudah" |
| "Oke makasih" → "Mau pesan? Ketik pesan" | AI dipanggil untuk obrolan | Terima kasih, "kaga", "lagi apa/kamu siapa", tawa, dan sapaan dijawab langsung tanpa AI; setelah pesanan, terima kasih menyebut nomor antrian |
| "Yang pesen ada berapa banyak" memulai pesanan palsu | Kata "pesen" di tengah kalimat | Pertanyaan (berapa/banyak/apakah…) bukan niat memesan; pertanyaan omzet/jumlah pelanggan lain ditolak sebagai data usaha |
| "Kau lagi apa" dibaca sebagai menu | Sesi tetap terbuka | Dua pesan berturut-turut yang tidak dipahami dengan keranjang kosong menutup sesi dengan ramah |
| "Hapus" tanpa nama | Dibaca sebagai nama menu | Bot menjawab cara memakainya; `hapus 2` menghapus berdasarkan nomor keranjang |
| "Gk jadi beli" malah ditanya dine-in lagi | Frasa batal terlalu sempit | gk/ga/nggak/enggak jadi/usah, udahan, dll. membatalkan pesanan (sedangkan "gak jadi latte" hanya menghapus latte) |
| Konfirmasi dikirim dua kali | — | Pesan kedua dijawab "nomor antrian N sudah tersimpan", tidak membuat pesanan ganda |

### Setelah pesanan tersimpan
- Balasan akhir menyebut nomor antrian, item, total, dan petunjuk: *status* atau *pesan* lagi.
- **`status`** (atau "udah jadi belum", "pesanan saya"): menampilkan status terkini (menunggu / sedang disiapkan / siap diambil / selesai / dibatalkan) dari database.
- **`batalkan pesanan`**: meminta konfirmasi, lalu membatalkan **hanya bila kasir belum memproses** (status *menunggu* dan belum dibayar); meja dine-in dilepas. Bila sudah diproses: diarahkan ke kasir.
- **`ubah pesanan`** pada pesanan tersimpan: dijelaskan bahwa pesanan sudah masuk kasir; pilihan membuat pesanan tambahan baru atau batalkan lalu pesan ulang.
- Menulis pesanan baru (`pesan`, atau langsung `macha late 1`) memulai pesanan baru dan menyebut bahwa pesanan sebelumnya sudah tersimpan.
- Dashboard menampilkan "Makan di tempat" (bukan "Meja -") untuk pesanan dine-in tanpa meja.

### Pengujian
93 tes lolos. Uji langsung dengan AI sungguhan memutar ulang percakapan nyata itu: seluruh kasus di atas terbukti, pesanan tersimpan (Rp89.000, tampil sebagai dine-in tanpa meja), dan data uji dibersihkan. Belum teruji ulang lewat ponsel sungguhan setelah perbaikan ini.

## 16. Pemberitahuan "pesanan siap" otomatis

- Saat kasir mengubah status pesanan menjadi **Siap** di dashboard, bot mengirim WhatsApp ke **nomor HP yang diisi pelanggan** (default-nya nomor yang chat dengan bot). Kode: `server/src/order/notify.ts`, dicek tiap 5 detik hanya saat WhatsApp tersambung.
- Dikirim sekali per pesanan (tabel `order_notifications`). Gagal kirim dicoba lagi sampai 5 kali. Pesanan yang sudah "siap" lebih dari 6 jam tidak dikabari (mencegah pesan basi setelah bot lama mati).
- Isi pesan menyesuaikan: bawa pulang / dine-in bermeja, dan menyebut total bila belum dibayar.
- Tes: `server/tests/notify.test.ts`.

## 17. Login WhatsApp hilang setelah restart: temuan dan pengaman

- Berkas sesi OpenWA (`server/session/cafesite.data.json`) berisi teks `LOGGED OUT` (10 byte) bila OpenWA memutuskan sesi tidak bisa dilanjutkan dan memulai pairing QR. Itu bukan berkas rusak; itu keputusan OpenWA setelah WhatsApp menolak sesi.
- Penyebab yang paling mungkin: dua bot memakai sesi yang sama (mis. bot lama masih hidup, atau `dev:watch` memulai ulang bot tiap file berubah). WhatsApp melepas perangkat tertaut bila sesi yang sama dipakai bersamaan.
- Pengaman baru: bot kini mengunci port kontrol (8787) SEBELUM menyentuh sesi. Bot kedua langsung berhenti dengan pesan jelas dan tidak mematikan Chrome atau mengubah berkas sesi bot pertama.
- Diagnosa: log kini menyebut "Sesi tersimpan ditemukan, mencoba melanjutkan tanpa QR" dan, bila QR tetap diminta, "WhatsApp meminta scan QR padahal ada sesi tersimpan: sesi ditolak ...".
- Gunakan `npm run dev` (bukan `dev:watch`) untuk bot yang sudah tertaut, dan hentikan dengan Ctrl+C satu kali.

### 17.1 Diagnosa lanjutan (login masih hilang setelah restart)

- Berkas sesi berubah menjadi `LOGGED OUT` sekitar 2 detik setelah Chrome dibuka, jauh sebelum WhatsApp Web sempat memuat. Itu terlalu cepat untuk keputusan "QR diminta"; yang cocok adalah jalur `portable_session_bootstrap_failed` / `session_reset_for_pairing` di OpenWA (checkpoint sesi gagal dipasang ke halaman, lalu OpenWA mereset sesi).
- Bot kini menulis peringatan OpenWA ke `server/session/openwa-warnings.log` (level warn, tanpa isi pesan) selain ke console. Baris `portable_session_bootstrap_failed` berisi kode penyebabnya.
- Bila penyebabnya tidak bisa diatasi di lapisan OpenWA, alternatif: ganti pustaka ke whatsapp-web.js dengan LocalAuth (profil Chrome permanen). Itu perubahan besar dan butuh persetujuan.

### 17.2 Kandidat penyebab utama dan perbaikannya (belum terbukti di WhatsApp asli)

Temuan: `snapshotSession` dijalankan 1,5 detik setelah Chrome dibuka dan memanggil `ownBrowserPids()` yang memakai
`execSync` PowerShell (Get-CimInstance, beberapa detik). Itu memblokir event loop Node tepat saat OpenWA memasang sesi
tersimpan ke halaman WhatsApp Web (jendela yang sama dengan `LOGGED OUT` ditulis ~2 detik setelah browser dibuka).
Saat scan QR pertama kali tidak ada sesi yang dipasang sehingga tidak terdampak; setiap restart terdampak.

Perbaikan di `server/src/whatsapp/client.ts`:
1. `ownBrowserPids`/`killOwnBrowsers` kini async (`execFile`), tidak memblokir event loop.
2. Pencatatan PID Chrome ditunda 30 detik (`SNAPSHOT_DELAY_MS`) setelah browser dibuka.
3. Jaring pengaman: bila QR tetap diminta padahal ada sesi tersimpan dan cadangan sehat, cadangan dipulihkan dan
   koneksi dicoba sekali lagi (sekali per proses) sebelum QR ditampilkan.
4. Peringatan OpenWA tetap dicatat ke `server/session/openwa-warnings.log` untuk diagnosa bila masih gagal.

Yang belum bisa diverifikasi tanpa ponsel: sesi benar-benar bertahan setelah restart. Uji: scan QR, tunggu tersambung,
Ctrl+C, nyalakan lagi; seharusnya log menampilkan "Sesi tersimpan ditemukan" lalu "WhatsApp tersambung" tanpa QR.
Catatan: start dingin bisa 30-50 detik (impor OpenWA + Chrome); itu normal.
