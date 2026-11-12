# Pesanan pribadi dan pembayaran kasir

GATE: FAIL 21 (pemeriksa landing page, round 1). Pemeriksaan fungsi dan browser transaksi tercatat di bawah; gate tidak dinyatakan lolos.

## Perilaku

- Sumber QR menentukan `dine_in` atau `takeaway`; `TKW-01` menjadi kanal takeaway tanpa mengubah ID/kunci QR.
- Scan menghasilkan tiket acak 15 menit. Database menyimpan hash tiket, hash cookie browser HttpOnly, sumber QR, dan hasil konsumsi. Checkout mengonsumsi tiket dan menyimpan pesanan dalam satu transaksi. Retry dengan request/payload yang sama mengembalikan pesanan yang sama.
- Semua pesanan baru menunggu pembayaran. Kasir melihat rincian terbaru melalui QR bertanda tangan khusus kasir atau nomor pesanan, kemudian mengonfirmasi `Lunas & proses`. Versi pesanan wajib cocok; pembayaran tidak dicatat dua kali.
- Pemesan dapat mengedit item/jumlah/catatan saat `waiting/unpaid`; harga dan ketersediaan dibaca ulang dalam transaksi. Pesanan lunas dikunci dan tambahan menjadi pesanan baru dengan scan baru.
- Registry token di browser tidak lagi memangkas sepuluh pesanan. `/pesanan` membaca hanya pasangan ID/token yang valid melalui batch maksimal 20. Tidak ada penggabungan berdasarkan telepon atau meja. Riwayat yang dahulu terpangkas atau dihapus browser tidak dapat dipulihkan otomatis.
- Pemantau global melakukan polling setiap 5 detik saat tab terlihat, ditambah pemicu Realtime dan pemulihan visibility/online. Audio dibuka melalui tombol pengguna; getar mengikuti dukungan perangkat. Alarm per pesanan dideduplikasi melalui Web Locks dan localStorage. Perangkat tanpa Web Locks memakai pemeriksaan localStorage sebagai fallback terbaik.
- Tidak ada Web Push. Tab tertutup, layar terkunci, atau pembatasan OS tidak dijanjikan membunyikan alarm.

## Migrasi dan deploy

1. Terapkan `supabase/12_customer_order_flow.sql` pada proyek Supabase yang dipakai `.env.local`. Skrip transaksional dan idempoten; tidak menandai pesanan historis sebagai lunas.
2. Periksa kolom `cafe_tables.order_mode`, tabel `order_scan_tickets`, RPC `cafesite_checkout`/`cafesite_edit_customer_order`, dan perubahan aturan pembayaran. RPC checkout menggunakan nama stabil yang sudah tersedia di produksi; perubahan kode dan migrasi harus dikoordinasikan.
3. Deploy aplikasi ke Vercel Production setelah migrasi terverifikasi. Secret `ORDER_ACCESS_SECRET` tetap memakai nilai yang sudah ada.
4. Verifikasi alur QR, pesanan milik browser, pembayaran, edit, dan status siap. Jangan mengunggah `.env`, database lokal, kredensial/hasil tes privat dari `.vercel`, atau profil browser pengujian.

## Pengujian yang dapat diulang

```powershell
node --test scripts/order-flow.test.mjs scripts/cloud-order-guard.test.mjs
server/node_modules/.bin/tsx --test scripts/qr-scan.test.ts
npm install --prefix .vercel/pg-check --no-audit --no-fund @electric-sql/pglite
node --test scripts/order-flow-postgres.test.mjs
node scripts/seed-order-flow-test.mjs
$env:CONTENT_SOURCE='sqlite'
$env:CAFE_SQLITE_PATH=(Join-Path (Get-Location) '.data/order-flow-e2e.db')
$env:CAFE_NEXT_DIST_DIR='.vercel/order-flow-next'
npx next dev --webpack --port 3012
# Terminal lain, setelah server siap:
node scripts/order-flow-http.test.mjs
```

Runtime PostgreSQL test dipasang hanya di direktori verifikasi yang diabaikan, tanpa dependency aplikasi baru. Pengujian HTTP menggunakan database SQLite terpisah dan akun kasir uji, tidak membuat pesanan produksi.

Hasil browser dan screenshot lokal: `.taste-skill/order-flow/`. Desain: `design/ordering/customer-orders.figcraft` dan `design/ordering/previews/`. Pengecekan browser mencakup 375/390/1440, isolasi browser, scan baru, suara setelah interaksi, fallback polling, dan deduplikasi tab. Kamera Android/iPhone fisik belum diuji melalui lingkungan ini.

## Penerapan desain

Layar pemesanan dan kasir merupakan UI transaksi, mengikuti adaptasi aplikasi dinamis pada `design/dashboard/README.md`: warna/font yang sama, formulir dan riwayat tumbuh mengikuti data, tombol minimal 44px, tanpa memaksakan hero/foto serta tinggi section satu layar dari pola landing page. File FigCraft disusun sebagai pasangan frame auto-layout sebelum UI baru dibuat. FigCraft CLI terpasang versi 0.11.2; font Plus Jakarta Sans belum tersedia di renderer FigCraft sehingga perbandingan tipografi 1:1 belum dapat dinyatakan selesai. Tampilan browser memakai font `next/font` proyek.

## Hasil verifikasi 12 November 2026

- 107 tes server, 5 tes alur SQLite, 4 tes PostgreSQL (termasuk izin anon), 3 tes guard cloud, dan 4 tes QR: **123 lolos**.
- Pemeriksaan HTTP: **21 lolos**, dijalankan juga pada server hasil build produksi lokal.
- Pemeriksaan browser hasil build produksi: **26 lolos**. Selain tiga lebar layar, meliputi checkout melalui UI, penyimpanan akses pribadi, edit jumlah melalui UI, navigasi client-side yang tetap meminta scan baru, alarm melalui polling, deduplikasi tab, serta banner saat audio/getar tidak tersedia.
- Build web produksi dan build server lolos. ESLint tidak memiliki error; delapan warning variabel tidak terpakai yang sudah ada tetap dicatat.
- Pengukuran lokal produksi untuk `/pesanan`: transfer 415,2 KiB, dua berkas font 64,8 KiB, CLS 0,000, LCP relatif CPU sekitar 232 ms, tanpa request rusak. Perf checker memberi dua FAIL (satu per viewport) karena menghitung dua nama fallback otomatis `next/font` sebagai dua keluarga font tambahan; dua WARN ukuran JS parsed 862 KiB. Tidak ada font aplikasi ketiga/keempat yang ditambahkan.
- Gate layout mencatat tujuh `shader-lint` pada simbol bundle webpack (bukan shader situs), satu `focus-visible` pada portal development Next.js, serta temuan CTA/headline/moment/hero/section/container untuk halaman riwayat kosong. State kosong sengaja tidak diisi data fiktif sebelum pelanggan memesan. Struktur aplikasi dan tinggi menurut konten dipertahankan sesuai brief, bukan dipaksa menjadi landing page. Tujuh WARN juga tetap tercatat. Waiver lama `motion-layer` tetap berlaku: CSS dibundel Next.js; waiver lama `copy-headings` tidak cocok dengan temuan halaman ini. Kit pemeriksa tidak diubah, dan tidak ada temuan yang disembunyikan.
- Tidak ada foto, fakta kedai, data pelanggan, atau dependency runtime aplikasi baru. Nomor/harga pada file desain hanya contoh state desain; seluruh pengujian memakai data uji terpisah.
- **Kesiapan produksi:** preflight 12 November memastikan kolom mode, tabel tiket, fungsi edit, penanda takeaway TKW-01, dan penolakan checkout tanpa tiket sudah tersedia pada Supabase produksi. Kode menggunakan nama RPC stabil yang terdeteksi. Deployment `dpl_2SfsnimCUY19SLUQXunidvVorFet` berstatus READY dan domain produksi sudah mengarah ke versi baru. **Belum:** uji kamera/getar pada Android dan iPhone fisik; pembandingan FigCraft 1:1 dengan font yang lengkap.

## Peluncuran produksi

- URL: https://cafesite-five.vercel.app ? deployment `dpl_2SfsnimCUY19SLUQXunidvVorFet`, 12 November 2026. Build Vercel berhasil.
- 20 pemeriksaan live lolos: rute publik, dua browser pada satu meja, mode dari sumber QR, isolasi token/URL, batch pribadi, retry idempoten, tiket sekali pakai dan terikat browser, edit/hitung ulang, QR kasir memerlukan staf, penolakan proses belum lunas, penolakan total kasir lama, QR TKW-01, dan status meja setelah pesanan aktif terakhir ditutup.
- Semua pesanan live uji tetap unpaid. Data uji milik run yang sama (pesanan, item terkait, tiket, dan sumber meja sementara) dibersihkan dengan ID/nama persis. Tidak ada pembayaran atau penjualan fiktif yang dicatat; nomor antrean yang sudah terpakai dapat menyisakan celah.
- Pembayaran nyata/konfirmasi kasir berizin dan alarm siap diambil sudah diuji pada lingkungan produksi lokal dengan fixture tersendiri; tidak disimulasikan sebagai transaksi lunas pada data produksi. Kamera dan getar Android/iPhone fisik masih memerlukan pengujian perangkat.
- Perbedaan kode status privasi terverifikasi: API cloud mengembalikan 403 untuk token tidak sah, SQLite mengembalikan 404; keduanya tidak membuka rincian pesanan.
