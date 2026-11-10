# CafeSite — catatan redesign publik

Redesign diterapkan langsung pada tujuh route publik: Home, Menu, Tentang, Galeri, Lokasi, Order, dan Status Pesanan. Dashboard dan kontrak API/database tidak diubah.

## Sistem tampilan

- Palet dan pasangan font mengikuti aturan project: charcoal, off-white, terracotta; Playfair Display dan Plus Jakarta Sans.
- Kontainer konten maksimal 1200px dengan gutter mobile 24px; CTA utama “Pesan sekarang”.
- Navigasi mobile, lightbox, checkout, dan pemindai QR memakai Escape, penguncian scroll, dan pemulihan fokus.
- Foto memakai aset lokal. Galeri membandingkan hash isi file sehingga foto yang sama dengan nama berbeda hanya tampil sekali.
- Motion dan picture-develops memakai aset skill yang tidak dimodifikasi. CSS motion digabung oleh Next.js ke stylesheet produksi.
- Konten cafe/menu menggunakan sumber bersama. Data fallback diberi penanda contoh; jam contoh tidak menghasilkan badge “Buka sekarang”, dan LocalBusiness JSON-LD hanya dibuat dari konten cafe yang telah tersimpan.

## Verifikasi lokal

- `npm run lint` dan `npm run build` berhasil.
- Pemeriksaan browser mencakup 49 kombinasi tujuh route dan lebar 1440, 1024, 820, 768, 390, 375, 320px.
- Total 69 pemeriksaan browser lulus, termasuk interaksi dan fixture status pesanan.
- Interaksi yang diuji: menu mobile dan Escape, action bar setelah hero, filter dan lightbox galeri, tambah/kurangi item, persistensi cart, kode meja checkout, takeaway, dan penutupan checkout.
- Lima status pesanan serta status pembayaran diuji memakai respons fixture yang diintersep lokal. Fixture tidak dikirim ke server.
- Pemeriksaan copy Home: 210 kata, tanpa FAIL atau WARN.
- Hasil terperinci dan screenshot disimpan di `.taste-skill/` (diabaikan Git).

## Batas verifikasi

Supabase pada konfigurasi lokal tidak dapat memuat data saat pemeriksaan. Preview produksi di port 3001 memakai data fallback melalui environment proses uji saja; file `.env.local` tidak diubah. Pesanan nyata tidak dikirim, sehingga checkout COD dan realtime end-to-end tetap perlu diuji dengan Supabase test yang tersedia.

Foto dan informasi cafe lokal masih memiliki penanda TODO dari project. Foto client dengan resolusi lebih tinggi diperlukan untuk ketajaman layar desktop retina.

## Finish gate skill

`GATE: OPEN 8 (rounds used up)` setelah tiga putaran. Gate belum PASS. Temuan yang masih terbuka:

1. `copy-fact`: checker tidak mengenali lokasi “Jakarta Selatan” yang tampil pada eyebrow hero sebagai fakta layar pertama.
2. `copy-headings`: nama menu Caramel Macchiato, Matcha Latte, dan judul “Ruang untuk ngopi & bertemu” ditandai oleh pengenal kata benda checker.
3. `photo-upscale`: foto hero lokal belum memenuhi ukuran yang diminta checker untuk desktop/retina.
4. `focus-visible`: checker menandai Tab stop “Jam & lokasi”. Verifikasi susulan dengan Tab asli menunjukkan `:focus-visible=true`, outline terracotta solid 2px, dan ring terlihat pada screenshot `.taste-skill/shots/focus-location-1440.png`. Data 12 Tab stop disimpan di `.taste-skill/focus-results.json`; gate tetap dilaporkan sebagai temuan terbuka.
5. `container-edges`: skip link berada pada root layout Next.js, di luar header halaman.
6. `container-edges`: wrapper `.cafe-public` diperlukan untuk membatasi styling dari dashboard; checker meminta struktur body tanpa wrapper.
7. `container-edges`: hero memisahkan foto dan teks sebagai dua anak layout; checker meminta satu anak in-flow.
8. `split-pair`: grid kontak bersarang pada footer ditandai berbeda dari garis split utama.

Satu waiver: `motion-layer`. File motion.css asli skill dimuat melalui import CSS Next.js dan digabung ke stylesheet produksi; checker mencari URL stylesheet mandiri. Aset skill tidak diubah.

Detail mentah dan 12 WARN non-blocking tersedia pada `.taste-skill/gate.json` serta `.taste-skill/gate/consistency/report.json`.

## Sampel performa awal

Pada satu run Chrome CPU: transfer Home sekitar 516 KiB desktop / 444 KiB mobile, gambar 190 / 144 KiB, dua file font 65 KiB, dan CLS 0.000 di kedua ukuran. Mobile FCP/LCP tercatat 148ms; desktop cold run mencatat FCP 6.56s sehingga angka desktop belum boleh dianggap hasil median.

Checker performa juga menandai enam gambar `next/image fill` tanpa atribut width/height meski parent memiliki rasio/tinggi terkunci dan CLS terukur nol. Prefetch RSC dilaporkan gagal oleh checker; pemeriksaan HTTP tersendiri pada tujuh endpoint halaman RSC mengembalikan status 200. Laporan mentah tersimpan di `.taste-skill/perf-home.json`.

Pengulangan tiga run: median FCP/LCP 312ms desktop dan 160ms mobile, median CLS 0.000 pada kedua ukuran. Transfer sekitar 512/442 KiB. Ini pengukuran Chrome CPU lokal, bukan skor Lighthouse atau data lapangan. Checker tetap berstatus FAIL karena deteksi dimensi gambar fill dan prefetch RSC tersebut (empat temuan gabungan, lima WARN); lihat `.taste-skill/perf-home-median.json`.

Screenshot akhir untuk seluruh tujuh route pada 1440px dan 390px sudah tersimpan di `.taste-skill/shots/`, ditambah screenshot status siap melalui fixture dan ring fokus keyboard.
