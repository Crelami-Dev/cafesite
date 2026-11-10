# DESIGN_TOKENS.md
## Spesifikasi Design System & Token Tailwind — CafeSite
**Dasar Acuan:** `RPD.md` §6 (Design System) & `BRAND_VOICE.md`  
**Tujuan:** Menjadi cetak biru tunggal (*single source of truth*) token styling yang siap dipetakan 1:1 ke dalam file `tailwind.config.ts` di Phase 2.  
> **PERINGATAN KONVENSI:** Tidak boleh ada hardcode kode HEX di dalam file komponen JSX. Semua style warna, tipografi, dan spasi wajib merujuk ke token yang didefinisikan di sini.

---

## 1. Skala Warna (Color Palette & Semantic Tokens) — THE TRIPARTITE 3-COLOR RULE

Website ini mengunci sistem visual pada **3 warna utama (2 warna wajib fondasi + 1 warna pendukung katalis)** sesuai arahan desain kontras tinggi, menghindari kekacauan palet bertumpuk:

### 1.1. Core 3-Color Palette Tokens

```typescript
// tailwind.config.ts / src/app/globals.css -> @theme
export const colors = {
  // 1. Charcoal Black (#20201E) — Primary Dark Canvas (60% WAJIB)
  // Karakter: matte black, warm, sophisticated. Bukan pure black (#000000).
  // Role: kanvas utama, hero background, navbar, footer, container kartu gelap.
  charcoal: {
    darkest: '#141413',  // Layer terdalam, batas kontras footer
    DEFAULT: '#20201E',  // Primary background / canvas utama
    light: '#2C2C29',    // Background kartu di atas dark surface
    lighter: '#383834',  // Card hover / active state
    border: '#454540',   // Border subtle pada tema gelap
    muted: '#63635E',    // Teks tersier / placeholder
  },

  // 2. Warm Off-White (#F1EEE8) — Primary Text & Structure (30% WAJIB)
  // Karakter: warm, soft, premium. Bukan stark hospital white (#FFFFFF).
  // Role: teks utama di atas charcoal, heading, border kontras, kanvas kartu terang.
  offwhite: {
    pure: '#FAF8F5',     // White highlight / card light surface
    DEFAULT: '#F1EEE8',  // Warna teks utama / background section terang
    subtle: '#E8E3D9',   // Border pembatas pada tema terang
    muted: '#C5BFB2',    // Teks sekunder / keterangan kecil
    darker: '#A8A295',   // Ikon dan ornamen redup
  },

  // 3. Terracotta / Brick Red (#A6533F) — Catalyst Pop Accent (10% PENDUKUNG)
  // Karakter: earthy, hangat, energetic. Berfungsi seperti 'neon pop' pada poster kontras tinggi.
  // Role: tombol aksi utama (Primary CTA), active tab, badge jam buka, focal highlight.
  terracotta: {
    light: '#C46B55',    // Tint aksen di atas latar gelap
    DEFAULT: '#A6533F',  // Tombol aksi utama (Primary CTA), highlight penting
    hover: '#8E4230',    // Hover state subtle (WCAG AAA contrast)
    dark: '#733324',     // Aksen pekat
    subtle: '#F6EAE7',   // Latar badge terracotta pada section terang
  },

  // Catatan: Warna sekunder lama (coffee, latte, espresso) telah disederhanakan
  // menjadi variasi layer dari Charcoal dan Off-White untuk menjaga kemurnian 3 warna.

  // Status & Utility Colors (Khusus technical indicator, bukan identitas visual)
  status: {
    open: '#38A169',     // Hijau untuk dot "Buka Sekarang"
    openBg: '#1C3829',   // Background dot buka tema gelap
    closed: '#E53E3E',   // Merah untuk dot "Tutup"
    closedBg: '#3C1E1E', // Background dot tutup
  }
};
```

### 1.2. Aturan Hierarki Warna (The 60 - 30 - 10 Rule)
- **60% — Charcoal Black (`#20201E`):** Kanvas gelap utama, menjaga atmosfer website tetap *mature, warm, clean, dan grounded*.
- **30% — Warm Off-White (`#F1EEE8`):** Tipografi display, paragraf isi, garis border pemisah, dan panel kontras.
- **10% — Terracotta Brick (`#A6533F`):** Warna pendukung katalis yang membuat 2 warna wajib tampil hidup, menggugah selera, dan memicu aksi klik (CTA).
- **PANTANGAN:** Dilarang menambahkan warna ke-4 ke palet visual.

### 1.3. Konteks Warna per Section (Color Context per Section)
- **Hero Section:** Charcoal Canvas (`#20201E`) + Off-White Type (`#F1EEE8`) + Terracotta CTA (`#A6533F`).
- **Menu Section:** Charcoal Light Card (`#2C2C29`) + Off-White Price & Name (`#F1EEE8`) + Terracotta Category Tag (`#A6533F`).
- **About Section:** Charcoal Canvas (`#20201E`) + Off-White Body + Terracotta Accent Quote.
- **Gallery Section:** Charcoal Canvas (`#20201E`) + Foto Dokumenter Asli.
- **Location & CTA:** Charcoal Base + Terracotta Button (`#A6533F`) + Off-White Text.
- **Footer Section:** Charcoal Darkest (`#141413`) + Off-White Muted Type (`#C5BFB2`).

### 1.4. Aturan Tombol (Button Rules)
- **Primary CTA:**
  - Background: `terracotta.DEFAULT` (`#A6533F`)
  - Text: `offwhite.DEFAULT` (`#F1EEE8`)
  - Hover: `terracotta.hover` (`#8E4230`) — solid, tanpa gradient.
- **Secondary CTA:**
  - Background: `transparent`
  - Border: `border-offwhite/40`
  - Text: `offwhite.DEFAULT` (`#F1EEE8`)
  - Hover: `bg-offwhite/10`, `border-offwhite`.

### 1.5. Aturan Latar Belakang (Background Rules)
- **Background Utama yang Diprioritaskan:** `#20201E`, `#F1EEE8`, `#332722`.
- **Supporting Background:** `#A6533F` (hanya untuk CTA banner), `#70483A`, `#C8A98A` (hanya untuk badge/kartu kecil).

### 1.6. Larangan Keras Warna (DO NOT)
- JANGAN menggunakan warna neon, ungu, biru terang, atau hijau terang.
- JANGAN menggunakan pure black (`#000000`) sebagai warna brand dominan.
- JANGAN menggunakan pure white (`#FFFFFF`) sebagai warna teks dominan (gunakan `#F1EEE8`).
- JANGAN membuat gradient warna kopi atau gradient terracotta yang mencolok.
- JANGAN menggunakan semua warna secara bersamaan di satu section.
- JANGAN menambah warna baru di luar palette hanya demi kesan "modern".

### 1.7. Brand Atmosphere & Vibe
- **Wajib Ditonjolkan:** *Warm, Moody, Matte, Earthy, Premium, Minimal, Relaxed, Authentic, Coffee-inspired*.
- **Wajib Dihindari:** *Neon, Cyberpunk, Futuristic, Playful SaaS, Corporate, Overly Colorful, Overly Glossy*.

### 1.8. Analisis Kontras Aksesibilitas (WCAG 2.1 Standards)
- **Teks Utama:** `offwhite.DEFAULT` (`#F1EEE8`) di atas latar `charcoal.DEFAULT` (`#20201E`) menghasilkan **kontras rasio 13.4:1** *(Lolos AAA Standar Google)*.
- **Teks Muted:** `offwhite.muted` (`#C5BFB2`) di atas latar `charcoal.DEFAULT` (`#20201E`) menghasilkan **kontras rasio 8.5:1** *(Lolos AAA)*.
- **Deep Espresso Background:** `offwhite.DEFAULT` (`#F1EEE8`) di atas latar `espresso.DEFAULT` (`#332722`) menghasilkan **kontras rasio 12.2:1** *(Lolos AAA)*.
- **Tombol Terracotta:** Teks `offwhite.DEFAULT` (`#F1EEE8`) di atas `terracotta.DEFAULT` (`#A6533F`) menghasilkan **kontras 4.6:1** *(Lolos AA)*. Pada state `terracotta.hover` (`#8E4230`), kontras mencapai **6.1:1** *(Lolos AAA untuk teks tebal/tombol)*.

### 1.9. Aturan Dark-Section vs Light-Section
1. **Dark Section (Default Experience - Charcoal):**  
   - Background: `bg-charcoal`
   - Heading: `text-offwhite`
   - Body Text: `text-offwhite-muted`
   - Kartu: `bg-charcoal-light border border-charcoal-border`
2. **Light Section (Kontras Selingan - misal: Section Menu Tertentu):**  
   - Background: `bg-offwhite`
   - Heading: `text-charcoal`
   - Body Text: `text-charcoal-muted`
   - Kartu: `bg-offwhite-pure border border-offwhite-subtle shadow-sm`

---

## 2. Tipografi & Font Pairing Proposals

// TODO: konfirmasi brand final client (Pilihan font default menggunakan Kandidat 1 di bawah).

### 2.1. Tiga Usulan Font Pairing Google Fonts (`next/font/google`)

| Kandidat | Font Heading | Font Body | Karakteristik Visual | Kesesuaian Brand Voice |
|:---:|---|---|---|---|
| **Kandidat 1 (Rekomendasi Utama)** | **Playfair Display** *(Serif)* | **Plus Jakarta Sans** *(Sans-Serif Variable)* | Perpaduan kehangatan klasik kafe premium dengan legibilitas modern ultra-tajam di smartphone. | Sangat pas untuk arketipe kafe artisanal, hangat, autentik, dan ramah. |
| **Kandidat 2 (Minimalis & Editorial)** | **Cormorant Garamond** *(Serif)* | **Inter** *(Sans-Serif Variable)* | Tipis, arsitektural, elegan, dan terasa seperti buku majalah kopi independen. | Cocok untuk Brand Voice Opsi B (Premium & Minimalis). |
| **Kandidat 3 (Hangat & Kasual)** | **Lora** *(Serif)* | **Outfit** *(Sans-Serif Variable)* | Kurva bersahabat, terasa seperti tempat santai sore dan ramah komunitas. | Cocok untuk Brand Voice Opsi A (Hangat & Santai). |

### 2.2. Contoh Komparasi Penggunaan (Hero Headline & Menu Item)

- **Kandidat 1 (Playfair Display + Plus Jakarta Sans) — *Rekomendasi Terpilih*:**
  - *Headline Hero:*  
    `<h1 class="font-serif text-4xl md:text-6xl font-medium tracking-tight">Kopi yang Diseduh Pelan-Pelan.</h1>`  
    `<p class="font-sans text-base md:text-lg text-offwhite-muted">Ruang yang terasa milik kamu. Nikmati seduhan single origin berkarakter.</p>`
  - *Item Menu:*  
    `<h3 class="font-serif text-lg font-semibold">Americano</h3>`  
    `<p class="font-sans text-sm text-offwhite-muted">Double shot espresso single origin Sumatra, diseduh V60 segar.</p>`
  - *Alasan Teknis:* `Playfair Display` dan `Plus Jakarta Sans` keduanya mendukung subset Latin efisien di `next/font` dengan format WOFF2 otomatis (tanpa pergeseran CLS dan ukuran bundle font < 45 KB).

---

### 2.3. Skala Tipografi (Fluid Typography Scale)

```typescript
// tailwind.config.ts -> theme.extend.fontSize
export const fontSize = {
  // Ukuran: [fontSize, { lineHeight, letterSpacing }]
  'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],       // 12px - Badges, captions
  'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],    // 14px - Meta info, sub-notes
  'base': ['1rem', { lineHeight: '1.625rem', letterSpacing: '0' }],          // 16px - Body text utama
  'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],   // 18px - Lead paragraph, menu title
  'xl': ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '-0.01em' }],   // 20px - Card headings
  '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],       // 24px - Section sub-headings
  '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],  // 30px - Section title mobile
  '4xl': ['2.25rem', { lineHeight: '2.625rem', letterSpacing: '-0.03em' }],  // 36px - Section title desktop
  '5xl': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.03em' }],         // 48px - Hero headline mobile
  '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.04em' }],       // 60px - Hero headline desktop
};
```

---

## 3. Skala Spasi (Spacing Scale — 4px Base)

Mengikuti kelipatan 4px standar industri untuk keselarasan vertikal (*vertical rhythm*):

```typescript
// tailwind.config.ts -> theme.extend.spacing
export const spacing = {
  '0.5': '0.125rem', // 2px
  '1': '0.25rem',    // 4px  - Minimal gap
  '2': '0.5rem',     // 8px  - Compact padding / chip gap
  '3': '0.75rem',    // 12px - Icon spacing
  '4': '1rem',       // 16px - Standard base padding
  '5': '1.25rem',    // 20px
  '6': '1.5rem',     // 24px - Card interior padding
  '8': '2rem',       // 32px - Medium section gap
  '10': '2.5rem',    // 40px
  '12': '3rem',      // 48px - Section padding mobile
  '16': '4rem',      // 64px - Section padding tablet
  '20': '5rem',      // 80px - Section padding desktop
  '24': '6rem',      // 96px - Major hero margins
  '32': '8rem',      // 128px
};
```

---

## 4. Sudut Lengkung (Border Radius) & Bayangan (Box Shadows)

### 4.1. Border Radius Tokens
Untuk menjaga nuansa hangat dan tidak kaku, elemen UI menggunakan sudut lembut (*organic rounded*):
- `rounded-sm`: `4px` — Tag kecil, badge "Open Now", checkmark.
- `rounded-md`: `8px` — Input form, tombol sekunder, kartu menu mobile.
- `rounded-lg`: `12px` — Kartu menu desktop, container gambar galeri.
- `rounded-xl`: `16px` — Box modal, floating CTA bar.
- `rounded-2xl`: `24px` — Container section utama yang membungkus konten.
- `rounded-full`: `9999px` — Tombol aksi melingkar, Floating WhatsApp, Pills navigasi.

### 4.2. Box Shadow Tokens
Bayangan halus bernuansa hangat (menggunakan campuran charcoal gelap, bukan hitam pekat):
```typescript
export const boxShadow = {
  'subtle': '0 1px 3px rgba(32, 32, 30, 0.12), 0 1px 2px rgba(32, 32, 30, 0.08)',
  'card': '0 4px 12px rgba(20, 20, 19, 0.25)',
  'card-hover': '0 8px 24px rgba(20, 20, 19, 0.4)',
  'floating': '0 10px 30px rgba(0, 0, 0, 0.35), 0 4px 6px rgba(0, 0, 0, 0.2)',
  'glow-terracotta': '0 0 20px rgba(166, 83, 63, 0.35)',
};
```

---

## 5. Responsive Breakpoints

Memastikan kepatuhan ketat terhadap aturan *mobile-first* (375px dasar):

| Breakpoint | Ukuran Min | Target Perangkat | Aturan Layout |
|---|---|---|---|
| **Base** | `< 640px` | Smartphone (375px – 480px) | Single column, padding horizontal 16px, sticky bottom CTA aktif |
| **`sm`** | `640px` | Large phone / Phablet | 2-kolom kartu ringkas, padding horizontal 24px |
| **`md`** | `768px` | Tablet / iPad Portrait | Hamburger menu berganti ke baris nav, sticky bottom CTA dinonaktifkan |
| **`lg`** | `1024px` | Laptop / iPad Landscape | Multi-column grid (3 kolom menu/galeri), sidebar info |
| **`xl`** | `1280px` | Desktop Monitor | Max container width 1200px, visual asimetris hero |
| **`2xl`** | `1536px` | Large Desktop / Ultra-wide | Max container width 1320px terpusat (*centered*) |

---

## 6. Checklist Pemetaan ke Phase 2 (`tailwind.config.ts`)

Saat memasuki Phase 2 (Project Setup), developer cukup mengimpor token ini ke konfigurasi Tailwind:
- [ ] Daftarkan objek `colors` (charcoal, offwhite, terracotta, coffee, latte, status)
- [ ] Konfigurasi font family `font-serif` (Playfair Display) dan `font-sans` (Plus Jakarta Sans) via `next/font/google`
- [ ] Daftarkan skala `spacing`, `borderRadius`, dan `boxShadow`
- [ ] Pasang plugin `@tailwindcss/typography` dan rasio aspek standar
- [ ] Verifikasi ulang apakah ada token warna brand tambahan dari jawaban client di `CONTENT_QUESTIONNAIRE.md`.
