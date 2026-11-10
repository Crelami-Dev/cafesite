# CafeSite Design System & FigCraft Rules
**Single Source of Truth untuk Aturan Desain, Tokens, dan Alur Kerja FigCraft / Figma-to-Code**

---

## 1. Disiplin Palet 3 Warna (The Tripartite Rule)

Website CafeSite menerapkan **disiplin ketat 3 warna (2 Warna Wajib Fondasi + 1 Warna Pendukung Katalis)** yang terinspirasi dari prinsip kontras tinggi visual poster modern (seperti rasio Black-White-Volt), namun diadaptasi 1:1 ke identitas hangat dan mature dari sebuah kedai kopi artisanal.

```
+------------------------------------------------------------------+
|                   60% CHARCOAL BLACK (#20201E)                   |
|                  Primary Dark Canvas & Surfaces                  |
+------------------------------------+-----------------------------+
|    30% WARM OFF-WHITE (#F1EEE8)    |  10% TERRACOTTA (#A6533F)   |
|   Typography, Contrast & Borders   |   Catalyst Pop & Action     |
+------------------------------------+-----------------------------+
```

### 1.1. Tiga Warna Resmi
| Peran | Nama Warna | Kode HEX | Utility Class Tailwind | Proporsi | Penggunaan Utama |
|---|---|---|---|---|---|
| **Wajib 1 (Dark Ground)** | **Charcoal Black** | `#20201E` | `bg-charcoal`, `border-charcoal-*` | **~60%** | Background utama halaman, hero surface, navbar, footer, container kartu gelap. |
| **Wajib 2 (Light & Structure)** | **Warm Off-White** | `#F1EEE8` | `text-offwhite`, `bg-offwhite`, `border-offwhite/*` | **~30%** | Teks heading, paragraf, garis pemisah halus (border), selingan kanvas kartu terang. |
| **Pendukung (Catalyst Pop)** | **Terracotta Brick** | `#A6533F` | `bg-terracotta`, `text-terracotta` | **~10%** | Tombol aksi utama (Primary CTA), active badge, pill pilihan, highlight monogram, focal graphics. |

### 1.2. Aturan Larangan Warna (Negative Rules)
- **DILARANG** menambahkan warna ke-4 ke dalam palet visual (misal: biru, kuning neon, hijau sembarang, ungu).
- **DILARANG** menggunakan pure black `#000000` atau pure stark white `#FFFFFF` sebagai warna bidang dominan. Selalu gunakan `Charcoal Black` (`#20201E`) dan `Warm Off-White` (`#F1EEE8`).
- **DILARANG** memakai nuansa cokelat acak (*random browns*). Semua variasi kedalaman atau kontras sekunder harus berasal dari tingkat permukaan (*surface shade*) atau alpha opacity dari Charcoal dan Off-White.
- **Pengecualian Khusus:** Indikator operasional teknis "Buka Sekarang" diperbolehkan menggunakan hijau status (`#38A169`), namun hanya terbatas pada dot/badge status jam operasional.

### 1.3. Variasi Permukaan & Opacity yang Diizinkan
Untuk menciptakan hierarki visual tanpa menambah warna baru:
- **Charcoal Surfaces:**
  - `charcoal-darkest` (`#141413`): Layer kontras terdalam.
  - `charcoal` (`#20201E`): Kanvas standar.
  - `charcoal-light` (`#2C2C29`): Background kartu di atas permukaan gelap.
  - `charcoal-lighter` (`#383834`): Hover state kartu / list item.
  - `charcoal-border` (`#454540` atau `border-offwhite/10`): Garis batas halus.
- **Off-White Contrasts:**
  - `offwhite` (`#F1EEE8`): Teks utama dan kanvas terang.
  - `offwhite-muted` (`#C5BFB2` atau `text-offwhite/70`): Teks sekunder, deskripsi menu, metadata waktu.
  - `offwhite/40`: Border tombol outline.
  - `offwhite/10`: Hover background subtle.
- **Terracotta Accents:**
  - `terracotta` (`#A6533F`): Standar CTA dan focal accent.
  - `terracotta-hover` (`#8E4230`): Hover state tombol.
  - `terracotta-light` (`#C46B55`): Aksen teks di latar gelap.

---

## 2. Tipografi & Hierarki Font

Kombinasi font dirancang untuk menghadirkan kesan editorial premium, tenang, dan mudah dibaca:

| Kategori | Font Family | Tailwind Class | Penggunaan | Karakteristik |
|---|---|---|---|---|
| **Editorial Serif** | `Playfair Display` | `font-serif` | Heading `<h1>`, `<h2>`, kutipan barista, angka menu spesial | Elegan, berkelas, memberikan rasa tradisi dan kehangatan |
| **Clean Modern Sans** | `Plus Jakarta Sans` | `font-sans` | Body text, `<h3>`, `<p>`, tombol, label harga, navigasi, tabel | Tegas, geometris modern, sangat terbaca di mobile |

### Aturan Skala Heading:
- `h1`: `text-4xl sm:text-5xl lg:text-6xl font-serif font-medium leading-[1.15] text-offwhite`
- `h2`: `text-2xl sm:text-3xl lg:text-4xl font-serif font-medium leading-snug text-offwhite`
- `h3`: `text-lg sm:text-xl font-sans font-semibold text-offwhite`
- Body Text: `text-sm sm:text-base font-sans leading-relaxed text-offwhite-muted`
- Label/Eyebrow: `text-xs font-sans font-semibold uppercase tracking-widest text-terracotta`

---

## 3. Spacing, Layout & Struktur Kontainer

- **Grid Base:** 4px / 8px scale.
  - Micro-spacing: `gap-1.5` (6px), `gap-2` (8px), `gap-3` (12px), `gap-4` (16px).
  - Component padding: `p-4` (16px) hingga `p-6` (24px) untuk card.
  - Section spacing: `py-12 sm:py-16 lg:py-24` untuk ritme ruang napas yang lega.
- **Border Radius:**
  - Tombol & Pill: `rounded-md` (6px) atau `rounded-full` untuk badge.
  - Kartu & Gambar: `rounded-lg` (8px) hingga `rounded-xl` (12px). Hindari radius yang terlalu membulat kekanak-kanakan (anti-slop).
- **Kontainer:**
  - Gunakan `<Container>`: Max width `max-w-7xl` untuk layout umum, `max-w-xl` atau `max-w-3xl` untuk konten editorial teks.
  - Padding horizontal: `px-4 sm:px-6 lg:px-8`.

---

## 4. Konvensi Komponen & Kode

1. **Server Component Default:**
   - Semua komponen secara default adalah React Server Component (RSC).
   - Tambahkan directive `"use client"` HANYA pada komponen yang memiliki state interaktif (misal: filter galeri, scanner QR, form order, drawer mobile).
2. **Komposisi Komponen UI:**
   - Gunakan komponen dasar dari `src/components/ui/`:
     - `Button`: Tombol interaktif dengan variant `solid` (terracotta), `outline` (offwhite border), `ghost`.
     - `Container`: Pembungkus lebar responsif dan padding horizontal.
     - `SectionHeading`: Header standar tiap seksi halaman.
3. **Ikonografi:**
   - Wajib gunakan ikon internal dari `src/components/ui/icons.tsx` (SVG murni, ringan, tanpa icon library eksternal).
   - DILARANG melakukan `npm install` library icon seperti fontawesome atau lucide-react tambahan.
4. **Pengelolaan Gambar:**
   - Selalu gunakan `next/image` dengan properti `alt` yang deskriptif dan bernilai estetis.
   - Tetapkan `sizes` dan aspek rasio eksplisit untuk mencegah Cumulative Layout Shift (CLS).
   - Foto harus bernuansa dokumenter hangat (kopi, barista, meja kayu, cahaya sore), bukan ilustrasi 3D kartun atau plastik AI render.

---

## 5. Alur Kerja FigCraft & Figma-to-Code

FigCraft dijalankan secara lokal dengan port kontrol loopback (`127.0.0.1:47800`):

### 5.1. Spesifikasi Frame Canvas di FigCraft
- **Desktop Artboard:** Lebar `1440px`, tinggi dinamis / auto-layout vertical, background `#20201E`.
- **Mobile Artboard:** Lebar `390px` (standar iPhone modern), tinggi dinamis, background `#20201E`.
- Tempatkan kedua artboard berdampingan di kanvas FigCraft dengan jarak pemisah `80px`.

### 5.2. Langkah Pembuatan Desain di FigCraft
1. **Setup Token / Styles di Canvas:**
   - Daftarkan 3 variabel warna utama: `Charcoal` (`#20201E`), `OffWhite` (`#F1EEE8`), `Terracotta` (`#A6533F`).
2. **Gunakan Auto-Layout:**
   - Setiap section adalah vertical auto-layout frame dengan padding dan gap yang terukur.
   - Hindari koordinat manual absolut untuk konten di dalam frame.
3. **Penerapan 3 Warna:**
   - Canvas & Kartu: Fill dengan `Charcoal` (`#20201E`) atau `Charcoal Light` (`#2C2C29`).
   - Teks & Pembatas: Teks `OffWhite` (`#F1EEE8`), Border `OffWhite` dengan alpha 10-20%.
   - Aksentuasi: Tombol CTA, active state, dan badge fill dengan `Terracotta` (`#A6533F`).

### 5.3. Dari FigCraft ke Kode
1. **Mapping 1:1:**
   - Frame auto-layout horizontal -> `flex flex-row items-center gap-*`
   - Frame auto-layout vertical -> `flex flex-col gap-*`
   - Frame grid -> `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-*`
2. **Verifikasi Visual:**
   - Periksa kesesuaian screenshot FigCraft terhadap tampilan browser pada resolusi 1440px dan 390px.
   - Pastikan tidak ada overflow horizontal pada resolusi mobile terkecil (360px - 375px).

