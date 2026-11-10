# HOMEPAGE_SPEC.md — Revamp homepage CafeSite

Project: `D:/tes/CafeSite` (Next.js 16.3.5 App Router, React 19, Tailwind v4, TypeScript strict). Homepage: `src/app/(public)/page.tsx`.
Permintaan user (Dede): homepage kurang bagus dan section terlalu sedikit. Teks harus simpel tapi orang langsung paham. Tipografi mantap, terasa dibuat manusia, bukan AI. Tampilan juga begitu. Situs harus terasa istimewa dan beda dari cafe lain. Perbaiki keseluruhan, hasil maksimal.

## Wajib baca sebelum kerja
- `AGENTS.md`, `.agents/DESIGN_SYSTEM_RULES.md`, `UI_REPAIR_NOTES.md`, `UI_REDESIGN_NOTES.md`.
- Next.js di repo ini versi baru dengan breaking changes: baca `node_modules/next/dist/docs/` yang relevan sebelum menulis kode Next.
- Skill frontend: terapkan disiplin `design-taste-frontend` (taste-skill) dan prinsip `frontend-design` (referensi ada di `D:/tes/skills-staging/atlas-skill/referensi/`). JANGAN pakai atlas-design.

## Kondisi sekarang (hasil audit)
- Homepage hanya 4 blok: `Hero`, `FeaturedMenu` (3 item), `AboutPreview` (2 foto), `VisitPanel`. Terlalu sepi.
- Komponen yang sudah ada tapi TIDAK terpasang di homepage: `Highlights`, `FacilitiesBar`, `GalleryStrip`, `GalleryPreview`, `LocationCTA`, `Testimonials`.
- Aset ada: 15 foto di `public/Image/Gallery/`, foto menu di `public/Image/Menu/`, data di `src/data/{cafe,menu,gallery,faq,location,testimonials}.ts`. Fitur pesan via QR meja (`/order?meja=...`), nomor antrian, dan halaman status pesanan (`/order/[id]`) sudah jadi.
- Hero: judul datar "Kopi & makanan di CafeSite." Tidak menjelaskan apa yang membuat tempat ini beda.

## Aturan keras (dari repo, tidak boleh dilanggar)
1. 3 warna saja: Charcoal `#20201E` (~60%), Warm Off-White `#F1EEE8` (~30%), Terracotta `#A6533F` (~10%). Variasi hanya lewat token/opacity yang sudah ada di `globals.css`. Hijau status `#38A169` hanya untuk dot "Buka sekarang".
2. Font tetap Playfair Display (judul) + Plus Jakarta Sans (isi). Tidak menambah font.
3. Tidak menambah dependency. Ikon hanya dari `src/components/ui/icons.tsx` (boleh tambah ikon SVG murni di file itu).
4. Server Component default; `"use client"` hanya untuk interaksi. Data terpisah dari UI (teks/data di `src/data/*`, bukan di dalam komponen besar). Logic besar tidak di `page.tsx`.
5. Semua gambar `next/image` + `alt` bermakna + `sizes`. Pakai foto lokal yang sudah ada. Tidak ada foto stock/AI baru.
6. Tidak mengarang fakta. Dilarang: testimoni/rating palsu, angka Wi-Fi, klaim "terbaik/bestseller", cerita pendiri, klaim sertifikasi. Data cafe di `cafe.ts` masih contoh (preview notice tetap tampil). Teks yang bergantung data kedai harus membaca dari data (`getPublicContent`), bukan hardcode jam/alamat.
7. Phase 2 DILARANG ditambah: sistem reservasi slot, login, CMS, payment baru. Pesan via `/order` yang sudah ada boleh ditautkan.
8. Jangan sentuh dashboard, API, database, cart, checkout, auth. Jangan `git reset/checkout/clean/commit`. Worktree sudah kotor oleh pekerjaan lain; jangan dibatalkan.
9. Kartu radius 8–12px, tombol 6px (sesuai token yang ada). Tanpa glassmorphism, tanpa gradient dekoratif, tanpa resting shadow tebal, tanpa `animate-pulse`. Tap target >= 44px. Fokus keyboard terlihat. Hormati `prefers-reduced-motion`. Tidak ada overflow horizontal di 320/375/390/768/1024/1440.
10. Update `TASK.md` setelah selesai (centang yang relevan).

## Prinsip copy
Bahasa Indonesia santai, kalimat pendek (rata-rata <= 18 kata), kata sehari-hari, kami/kamu. Tiap section langsung menjawab satu pertanyaan pengunjung. Judul section literal dan jelas, bukan puitis kabur. Tidak ada jargon tak terjelaskan. Label kecil uppercase paling banyak 1 kali di seluruh halaman, bukan di tiap section.

## Prinsip tipografi & tampilan
- Judul Playfair besar dengan kontras skala jelas (clamp), 1 kata/frasa kunci boleh italic Playfair sebagai penekanan manusiawi (maksimal 1 per layar).
- Isi 16–18px, line-height 1.6–1.7, lebar baca maks ~62ch. Harga pakai `tabular-nums`.
- Ritme section bervariasi: full-bleed foto, split asimetris, daftar editorial bergaris, strip horizontal. Dilarang 3 kartu identik berjejer lebih dari sekali di seluruh halaman. Selang-seling latar charcoal dan off-white (sudah dipakai FeaturedMenu).
- Hero, foto, dan detail kecil harus terasa disusun tangan: perataan konsisten, jarak tidak seragam kaku, bukan template.

## Struktur homepage target (urutan)
1. **Hero** — pernyataan jelas apa CafeSite dan apa yang bisa dilakukan pengunjung (lihat menu, pesan dari meja, tahu jam buka). Dua CTA: Pesan sekarang, Lihat menu. Baris status buka/tutup memakai `OpenNowBadge` hanya bila data kedai terkonfirmasi (perilaku sekarang dipertahankan).
2. **Cara pesan dari mejamu** (pembeda #1, fitur NYATA yang sudah ada): 3 langkah singkat — scan QR di meja, pilih menu, pantau nomor antrian di HP. Tautan ke `/order`. Jelaskan juga opsi bawa pulang. Tanpa ikon-lingkaran identik; pakai penomoran besar tipografis.
3. **Menu pilihan** — 6 item unggulan dengan foto, nama, harga, 1 kalimat deskripsi dari data. Tautan ke `/menu`. Data dari `getMenuItems()`; item `isFeatured` dulu, lengkapi dari tersedia lain.
4. **Bingung pesan apa?** (pembeda #2) — pemilih interaktif client: pertanyaan 1: lagi pengin apa (kopi / bukan kopi / makan / ngemil / penutup); pertanyaan 2: rasanya (manis / segar / gurih-pekat) memakai `tags` + `category` menu. Hasil: 1 rekomendasi (foto, nama, harga, alasan 1 kalimat) + tombol "Pesan ini" ke `/order` + tombol "Coba lagi". Berfungsi dengan keyboard, `aria-live` untuk hasil. Jika data menu dari Supabase tidak punya tag cocok, fallback ke item unggulan. Logic cocok-mencocokkan di `src/lib/` (fungsi murni, mudah diuji), data mapping di `src/data/`.
5. **Mau duduk di mana?** (pembeda #3) — panduan tempat duduk berbasis foto NYATA yang ada: meja jendela, meja komunal, sudut tenang, rak bacaan/area lain sesuai `gallery.ts`. Tiap zona: foto + 1–2 kalimat jujur dari caption/data yang ada (colokan hanya bila disebut di data). Layout asimetris, bukan grid seragam.
6. **Fasilitas** — pasang `FacilitiesBar` yang sudah ada tapi buang angka tak terkonfirmasi ("100 Mbps" jadi "Wi-Fi"). Tampil sebagai daftar ringkas bergaris, bukan kartu.
7. **Galeri** — pasang `GalleryPreview` (collage interaktif yang sudah ada). Rapikan judul/copy-nya.
8. **Kata pengunjung** — render HANYA bila `content.testimonials` dari data tersimpan (CMS) tidak kosong. Jika kosong, section tidak muncul sama sekali. Dilarang menampilkan data contoh `testimonials.ts` sebagai ulasan asli.
9. **Tanya jawab** — FAQ memakai `<details>/<summary>` native, sumber `src/data/faq.ts` (rapikan copy jawabannya agar pendek dan tidak mengarang fasilitas; tandai TODO bila perlu konfirmasi client).
10. **Kunjungi** — `VisitPanel` (alamat, jam, Maps, WhatsApp) dipertahankan, copy dirapikan.
11. Navbar/Footer: tautan tetap ke halaman yang ada; tambah anchor homepage bila perlu. Semua anchor harus punya tujuan.

## Acceptance (audit Rivo)
- `npm run lint` dan `npm run build` exit 0, tanpa error TS.
- Uji browser: `next start -p 3001` lalu `node .taste-skill/check-public-ui.mjs` semua PASS (7 route x 7 lebar), ditambah uji baru untuk pemilih menu (pilih jawaban -> rekomendasi muncul -> coba lagi) dan FAQ buka/tutup.
- Grep kode homepage: tidak ada `backdrop-blur`, `animate-pulse`, `bg-gradient-to`, warna hex baru, library baru di `package.json`.
- Tidak ada testimoni/rating/angka Wi-Fi/klaim palsu tampil. Section ulasan tidak muncul saat data kosong.
- Tidak ada 3 kartu ikon identik berulang. Label uppercase kecil tidak muncul di tiap section.
- Homepage minimal 9 section terlihat (saat data ulasan kosong), urutan sesuai spec.
- Kontras teks >= 4.5:1, tap target >= 44px, fokus terlihat, no horizontal overflow.
- `TASK.md` diperbarui.
