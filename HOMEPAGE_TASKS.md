# HOMEPAGE_TASKS.md — Rencana Eksekusi Revamp Homepage CafeSite

Dokumen resmi pemecahan `HOMEPAGE_SPEC.md` menjadi task sekuensial dan terisolasi untuk agent.
Gatekeeper & QA Lead: **Rivo** (caveman-analyst).
Stack: Next.js 16.3.5 (App Router), React 19, Tailwind CSS v4, TypeScript strict.

---

## Aturan Besi Tim (Wajib Patuh)
1. **Dilarang keras menyentuh git:** Jangan `git reset`, `git checkout`, `git clean`, atau `git commit`. Worktree kotor oleh pekerjaan lain di luar homepage.
2. **Tanpa dependency baru:** Dilarang `npm i` atau menambah package baru ke `package.json`.
3. **Disiplin 3 Warna:** Charcoal `#20201E` (~60%), Warm Off-White `#F1EEE8` (~30%), Terracotta `#A6533F` (~10%). Status dot hijau `#38A169` hanya untuk operasional buka. Hapus semua kelas liar seperti `text-latte`, `backdrop-blur-*`, `animate-pulse`, `bg-gradient-*`.
4. **Bebas Data Karangan:** Dilarang mengarang testimoni, rating, kecepatan Wi-Fi ("100 Mbps"), atau klaim sertifikasi. Section ulasan hanya tampil jika data CMS ulasan ada; jika kosong, sembunyikan section.
5. **Aksesibilitas & Responsif:** Minimal tap target 44x44px, kontras teks >= 4.5:1, keyboard focus outline tampak, no horizontal overflow di 320/375/390/768/1024/1440px.

---

## Daftar Task & Assignee

| Task | Target Section / Scope | Assignee | Output File Utama |
|---|---|---|---|
| **Task 1** | Pure Logic & Data Pemilih Menu ("Bingung pesan apa?") | **Cody** | `src/lib/menu-recommendation.ts`, `src/data/menu-picker.ts` |
| **Task 2** | Section 1 (Hero) & Section 2 (Cara Pesan dari Mejamu) | **Joko** | `src/components/home/Hero.tsx`, `src/components/home/OrderGuideSection.tsx` |
| **Task 3** | Section 3 (Menu Pilihan 6 Item) & Section 4 (UI Pemilih Menu Interaktif) | **Joko** | `src/components/home/FeaturedMenu.tsx`, `src/components/home/MenuPicker.tsx` |
| **Task 4** | Section 5 (Mau Duduk di Mana?) & Section 6 (Fasilitas - Daftar Bergaris) | **Joko** | `src/components/home/SeatingGuide.tsx`, `src/components/home/FacilitiesBar.tsx` |
| **Task 5** | Section 7 (Galeri), Section 8 (Testimoni Kondisional), Section 9 (Tanya Jawab FAQ) | **Joko** | `src/components/home/GalleryPreview.tsx`, `src/components/home/Testimonials.tsx`, `src/components/home/HomeFaq.tsx` |
| **Task 6** | Integrasi Total Homepage (`page.tsx`) & Polish Section 10 (Kunjungi) | **Cody** | `src/app/(public)/page.tsx`, `src/components/public/VisitPanel.tsx` |
| **Task 7** | Audit QA Kumulatif, Browser Testing & Update TASK.md | **Rivo** | `.taste-skill/check-public-ui.mjs`, `TASK.md` |

---

## Rincian Spesifikasi Per Task

### Task 1 — Pure Logic & Data Pemilih Menu Rekomendasi
- **Target:** Fondasi logic murni penentuan rekomendasi menu untuk fitur "Bingung pesan apa?" (Section 4).
- **Assignee:** Cody (Coder / Data & Pure Logic).
- **File yang Disentuh:**
  - `src/lib/menu-recommendation.ts` (baru)
  - `src/data/menu-picker.ts` (baru)
  - (Opsional jika butuh tipe khusus): `src/types/index.ts`
- **Spesifikasi:**
  1. Data pilihan langkah 1 (mood/keinginan): Kopi (`coffee`), Bukan Kopi (`non-coffee`), Makanan (`food`), Camilan (`snack`), Penutup (`dessert`).
  2. Data pilihan langkah 2 (profil rasa): Manis (`sweet`), Segar (`refreshing`), Gurih/Pekat (`rich-savory`).
  3. Mapping logic pencocokan menu berdasarkan atribut `category` dan array `tags` pada item menu (misal: "Sweet", "Single Origin", "Hearty", "Sharing", "Refreshing", "Spicy", "Japanese", "French", dll).
  4. Fungsi murni `recommendMenu(menu: MenuItem[], cravingId: string, flavorId: string): MenuItem`:
     - Filter item yang `isAvailable !== false`.
     - Hitung skor kecocokan kategori dan tag rasa.
     - Ambil item terbaik. Jika tidak ada tag cocok atau kategori kosong, fallback aman ke item unggulan (`isFeatured === true`) pertama yang tersedia.
     - Tambahkan fungsi helper yang merangkai 1 kalimat alasan rekomendasi jujur & manusiawi tanpa kata robotik (misal: "Espresso berpadu karamel manis buat nemenin kamu rehat sore.").
  5. Sediakan skrip uji unit sederhana (misal dijalankan via `node`) untuk membuktikan semua kombinasi pilihan menghasilkan rekomendasi valid tanpa crash.
- **Checklist Lulus:**
  - [ ] Fungsi `recommendMenu` murni (deterministic, zero side effects).
  - [ ] Fallback ke `isFeatured` bekerja saat data menu tidak memiliki tag cocok.
  - [ ] Tidak ada penambahan dependency package.
  - [ ] TypeScript strict: zero error `any` implisit.
- **Perintah Verifikasi:**
  ```bash
  npm run lint
  npx tsc --noEmit
  ```

---

### Task 2 — Section 1 (Hero) & Section 2 (Cara Pesan dari Mejamu)
- **Target:** Menata ulang Hero agar menjawab fungsi kedai secara jelas dan membuat Section 2 (Pembeda #1: Alur Pemesanan Meja).
- **Assignee:** Joko (Frontend / UI).
- **File yang Disentuh:**
  - `src/components/home/Hero.tsx`
  - `src/components/home/OrderGuideSection.tsx` (baru)
- **Spesifikasi:**
  1. **Hero (`Hero.tsx`):**
     - Judul Playfair Display jelas: tidak datar sekadar "Kopi & makanan", melainkan pernyataan karakter kedai (misal: "Kopi yang diseduh tenang, meja untuk harimu."). 1 kata/frasa kunci boleh italic Playfair.
     - Lead paragraph menjelaskan 3 hal: lihat menu, pesan mandiri dari meja, tahu jam buka.
     - Dua CTA: Primer "Pesan sekarang" (`/order`), Sekunder "Lihat menu" (`/menu`).
     - Tampilkan `OpenNowBadge` hanya bila data kedai terkonfirmasi (`cafeConfirmed === true`).
     - Foto hero menggunakan aset lokal teroptimasi `next/image` (`sizes`, `priority`).
  2. **Cara Pesan dari Mejamu (`OrderGuideSection.tsx`):**
     - Heading Playfair Display literal & ringkas: "Cara pesan dari mejamu."
     - Penjelasan 3 langkah memakai penomoran tipografis besar (bukan kartu/lingkaran ikon template seragam):
       1. **01 · Scan QR di Meja** — Buka kamera HP, scan kode QR di sudut meja untuk buka menu.
       2. **02 · Pilih & Pesan** — Pilih minuman atau makanan favorit, tambah catatan jika ada preferensi.
       3. **03 · Pantau Antrean di HP** — Cek nomor antreanmu secara live sambil duduk santai. Bayar di kasir.
     - Berikan catatan jujur untuk opsi bawa pulang (takeaway) yang bisa dipesan langsung tanpa nomor meja.
     - Tautan CTA ke `/order` ("Buka menu pesanan ↗").
- **Checklist Lulus:**
  - [ ] Tidak ada kartu ikon lingkaran identik.
  - [ ] Tap target link/button >= 44px.
  - [ ] Semantic tag `<section>`, `<h2>`, `<ol>/<li>`.
  - [ ] Palet 60-30-10 strictly Charcoal & Off-White, aksen Terracotta.
- **Perintah Verifikasi:**
  ```bash
  npm run lint
  npx tsc --noEmit
  ```

---

### Task 3 — Section 3 (Menu Pilihan) & Section 4 (Pemilih Menu Interaktif)
- **Target:** 6 item menu unggulan + komponen client interaktif "Bingung pesan apa?".
- **Assignee:** Joko (Frontend / UI).
- **File yang Disentuh:**
  - `src/components/home/FeaturedMenu.tsx`
  - `src/components/home/MenuPicker.tsx` (baru)
- **Spesifikasi:**
  1. **FeaturedMenu (`FeaturedMenu.tsx`):**
     - Menampilkan tepat 6 item menu (ambil item `isFeatured` dulu dari `getMenuItems()`, lengkapi dari ketersediaan lain hingga 6 item).
     - Field per item: foto lokal `next/image`, nama item, harga dengan format `tabular-nums`, 1 kalimat deskripsi dari data.
     - Layout editorial responsif: grid berkontras, latar Warm Off-White (`bg-offwhite text-charcoal`) untuk selingan ritme visual.
     - Tautan CTA ke `/menu` ("Lihat semua menu ↗").
  2. **MenuPicker (`MenuPicker.tsx`):**
     - Client Component (`"use client"`).
     - Judul: "Bingung pesan apa?" + subjudul singkat menjawab rasa ragu pengunjung.
     - Pertanyaan 1: "Lagi pengin apa?" (Pilihan chip: Kopi, Bukan Kopi, Makanan, Camilan, Penutup).
     - Pertanyaan 2: "Preferensi rasa?" (Pilihan chip: Manis, Segar, Gurih / Pekat).
     - Hasil rekomendasi: Muncul di bawah dengan transisi halus dan atribut `aria-live="polite"` untuk screen reader. Menampilkan foto, nama item, harga, 1 kalimat alasan, tombol "Pesan ini" (mengarah ke `/order`), dan tombol "Coba lagi" (reset state).
     - Aksesibel via keyboard (Tab, Enter/Space pada opsi) dan touch-friendly (min 44px).
- **Checklist Lulus:**
  - [ ] 6 menu unggulan tampil rapi di desktop (grid 3x2) dan mobile tanpa horizontal overflow.
  - [ ] Interaksi pemilih menu bekerja mulus: pilih pertanyaan 1 & 2 -> kartu hasil muncul -> coba lagi mereset state.
  - [ ] Tidak ada library animasi eksternal atau state manager berat.
- **Perintah Verifikasi:**
  ```bash
  npm run lint
  npx tsc --noEmit
  ```

---

### Task 4 — Section 5 (Mau Duduk di Mana?) & Section 6 (Fasilitas Bergaris)
- **Target:** Panduan area duduk berdasarkan foto nyata + refactor fasilitas menjadi daftar ringkas bergaris tanpa klaim palsu.
- **Assignee:** Joko (Frontend / UI).
- **File yang Disentuh:**
  - `src/components/home/SeatingGuide.tsx` (baru)
  - `src/components/home/FacilitiesBar.tsx` (refactor)
- **Spesifikasi:**
  1. **Mau Duduk di Mana? (`SeatingGuide.tsx`):**
     - Judul: "Mau duduk di mana?"
     - Layout asimetris editorial (bukan grid seragam kaku), menyajikan 4 zona nyata berbasis foto di `gallery.ts`:
       1. Meja Jendela (`/Image/Gallery/gal-01-window-table.jpg`) — Cahaya alami sore hari, pas buat yang ingin sendiri atau baca buku.
       2. Meja Komunal (`/Image/Gallery/gal-10-meja-komunal.jpg`) — Meja kayu panjang di tengah ruangan, cocok buat buka laptop atau diskusi santai.
       3. Sudut Tenang (`/Image/Gallery/gal-04-quiet-corner.jpg`) — Area pojok dengan pencahayaan hangat dan distraksi minimal.
       4. Rak Bacaan & Bar (`/Image/Gallery/gal-11-rak-bacaan.jpg`) — Dekat dengan aroma seduhan barista dan rak buku kecil.
     - Deskripsi jujur 1–2 kalimat per zona, tidak melebih-lebihkan colokan/kecepatan internet kecuali sesuai data.
  2. **Fasilitas (`FacilitiesBar.tsx`):**
     - Buang styling `taste-card`, `backdrop-blur-*`, dan container kartu berulang.
     - Buang angka karangan: ubah "Wi-Fi 100 Mbps" menjadi sekadar "Wi-Fi stabil".
     - Buang klaim "Colokan di Tiap Meja" menjadi "Stopkontak di beberapa area".
     - Tampilkan sebagai **daftar ringkas bergaris** (editorial lined list horizontal di desktop, vertical bergaris tipis `border-offwhite/15` di mobile).
- **Checklist Lulus:**
  - [ ] Tidak ada lagi class `backdrop-blur-xs` atau shadow tebal.
  - [ ] Angka fiktif 100 Mbps 100% musnah dari kode.
  - [ ] Foto zona tempat duduk memiliki `alt` spesifik dan aspect ratio terkunci.
- **Perintah Verifikasi:**
  ```bash
  npm run lint
  npx tsc --noEmit
  ```

---

### Task 5 — Section 7 (Galeri), Section 8 (Testimoni Kondisional), Section 9 (FAQ)
- **Target:** Pasang galeri interaktif, amankan ulasan ulasan agar hanya muncul jika data ada, dan buat FAQ native `<details>`.
- **Assignee:** Joko (Frontend / UI).
- **File yang Disentuh:**
  - `src/components/home/GalleryPreview.tsx` (polish copy & hilangkan class terlarang `text-latte`)
  - `src/components/home/Testimonials.tsx` (refactor prop & kondisional rendering)
  - `src/components/home/HomeFaq.tsx` (baru)
- **Spesifikasi:**
  1. **Galeri (`GalleryPreview.tsx`):**
     - Gunakan `GalleryPreviewGrid` yang sudah ada.
     - Rapikan copy heading: buang eyebrow uppercase ganda, ganti tombol icon dari `text-latte` ke token resmi `text-terracotta` atau `text-offwhite`.
     - Tautan ke `/gallery` ("Buka galeri lengkap ↗").
  2. **Kata Pengunjung (`Testimonials.tsx`):**
     - Terima props `testimonials: Testimonial[]`.
     - JIKA `testimonials.length === 0`, return `null` (section tidak boleh dirender sama sekali).
     - Hapus impor langsung `import { testimonials } from "@/data/testimonials"` agar tidak bocor menampilkan data contoh palsu.
     - Rapikan bintang dan warna: buang class `text-latte`, gunakan `text-terracotta` untuk aksen rating.
  3. **Tanya Jawab (`HomeFaq.tsx`):**
     - Judul: "Tanya jawab seputar kedai."
     - Render menggunakan elemen semantic HTML `<details>` dan `<summary>` native.
     - Ambil data dari `src/data/faq.ts` atau data FAQ umum.
     - Jawaban padat, faktual, tidak mengarang fasilitas.
     - Style accordion bersih dengan border tipis `border-offwhite/15`, transisi ringkas tanpa script JS tambahan.
- **Checklist Lulus:**
  - [ ] Section Testimoni tidak merender apa pun saat prop testimoni kosong.
  - [ ] Zero mention class `text-latte`.
  - [ ] FAQ native keyboard accessible (Enter/Space membuka dan menutup summary).
- **Perintah Verifikasi:**
  ```bash
  npm run lint
  npx tsc --noEmit
  ```

---

### Task 6 — Integrasi Total Homepage (`page.tsx`) & Polish VisitPanel
- **Target:** Merangkai 10 section secara utuh di `src/app/(public)/page.tsx` sesuai urutan spec, memastikan data flow Server Component aman.
- **Assignee:** Cody (Coder / Integration).
- **File yang Disentuh:**
  - `src/app/(public)/page.tsx`
  - `src/components/public/VisitPanel.tsx` (polish)
- **Spesifikasi:**
  1. Ambil data melalui `getPublicContent()` dan `getMenuItems()`.
  2. Render 10 section secara berurutan:
     1. `<Hero cafe={cafe} cafeConfirmed={cafeConfirmed} />`
     2. `<OrderGuideSection />`
     3. `<FeaturedMenu items={featuredItems} />`
     4. `<MenuPicker items={availableMenuItems} />`
     5. `<SeatingGuide />`
     6. `<FacilitiesBar />`
     7. `<GalleryPreview />`
     8. `<Testimonials testimonials={content.testimonials} />` (kondisional)
     9. `<HomeFaq items={faqItems} />`
     10. `<VisitPanel cafe={cafe} configured={cafeConfirmed} />`
  3. Periksa `VisitPanel`: pastikan jam dan alamat tidak hardcoded, periksa kontras tombol dan outline focus.
  4. Pastikan hierarki heading halaman: hanya 1 buah `<h1>` (di Hero), seluruh section memakai `<h2>`, dan sub-item memakai `<h3>`.
- **Checklist Lulus:**
  - [ ] Total minimal 9 section tampil saat data ulasan kosong.
  - [ ] Urutan section persis sama dengan § Struktur Homepage Target di `HOMEPAGE_SPEC.md`.
  - [ ] Server Component default terjaga, hanya `MenuPicker` dan komponen interaktif berizin `"use client"`.
- **Perintah Verifikasi:**
  ```bash
  npm run lint
  npm run build
  ```

---

### Task 7 — Audit QA Kumulatif, Browser Testing & Sinkronisasi Dokumen
- **Target:** Verifikasi build produksi, kepatuhan desain (3 warna, no slop), uji browser fungsional & responsif, pembaruan dokumen status.
- **Assignee:** Rivo (Reviewer & QA Lead).
- **File yang Disentuh:**
  - `.taste-skill/check-public-ui.mjs` (tambahkan assert untuk interaksi MenuPicker dan FAQ)
  - `TASK.md` (centang item yang relevan)
- **Kriteria Audit Rivo:**
  1. `npm run lint` dan `npm run build` exit code 0.
  2. Eksekusi `node .taste-skill/check-public-ui.mjs` di port 3001: semua skenario lulus (7 route x 7 lebar resolusi: 1440, 1024, 820, 768, 390, 375, 320px).
  3. Grep codebase homepage:
     - 0 instance `backdrop-blur`
     - 0 instance `animate-pulse`
     - 0 instance `bg-gradient-`
     - 0 instance `text-latte`
     - 0 instance kata "100 Mbps"
  4. Kontras warna teks memenuhi WCAG AA (>= 4.5:1).
  5. Worktree git bersih dari aksi `git reset/clean/commit`.
  6. Dokumen `TASK.md` diperbarui dengan status terkini.
- **Perintah Verifikasi:**
  ```bash
  npm run lint && npm run build
  # Uji browser via test script
  node .taste-skill/check-public-ui.mjs
  ```
