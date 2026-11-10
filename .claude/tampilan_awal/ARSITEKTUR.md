# ARSITEKTUR.md
## Project: CafeSite

---

## 1. Tech Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| Framework | Next.js (App Router) | SSR/SSG, Metadata API, image optimization, performa baik untuk SEO |
| Bahasa | TypeScript | Type-safe, lebih maintainable saat project membesar |
| UI Library | React | Component-based |
| Styling | Tailwind CSS | Utility-first, konsisten dengan design system |
| Hosting | Vercel (direkomendasikan) | Native support Next.js |
| Data (v1) | Static data (TypeScript files) | Belum butuh database untuk versi gratis |

> Catatan: TypeScript sendiri tidak membuat SEO-friendly — kombinasi rendering strategy, semantic HTML, metadata, dan performa yang berperan.

---

## 2. Struktur Folder

```
src/
├── app/
│   ├── page.tsx                # Home
│   ├── layout.tsx              # Root layout + metadata dasar
│   ├── sitemap.ts              # Sitemap generator
│   ├── robots.ts               # Robots.txt generator
│   ├── menu/
│   │   └── page.tsx
│   ├── about/
│   │   └── page.tsx
│   ├── gallery/
│   │   └── page.tsx
│   └── location/
│       └── page.tsx
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   │
│   ├── home/
│   │   ├── Hero.tsx
│   │   ├── Highlights.tsx
│   │   ├── FeaturedMenu.tsx
│   │   ├── AboutPreview.tsx
│   │   ├── GalleryPreview.tsx
│   │   └── LocationCTA.tsx
│   │
│   ├── menu/
│   │   ├── MenuList.tsx
│   │   └── MenuItemCard.tsx
│   │
│   ├── gallery/
│   │   └── GalleryGrid.tsx
│   │
│   └── ui/
│       ├── Button.tsx
│       ├── Container.tsx
│       └── SectionHeading.tsx
│
├── data/
│   ├── menu.ts                 # Data menu (categories, items)
│   └── cafe.ts                 # Info cafe (nama, alamat, jam, sosmed)
│
├── lib/
│   └── utils.ts                # Helper functions
│
└── types/
    └── index.ts                 # MenuItem, MenuCategory, CafeInfo, GalleryImage, dll.
```

Prinsip: satu `page.tsx` tidak boleh berisi ribuan baris — logic & UI dipecah ke `components/`, data dipisah ke `data/`.

---

## 3. Data Model (Konsep)

```ts
// types/index.ts

type MenuCategory = "coffee" | "non-coffee" | "food" | "snack" | "dessert";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image?: string;
  tags?: string[];
}

interface CafeInfo {
  name: string;
  address: string;
  openingHours: { day: string; hours: string }[];
  whatsapp: string;
  instagram: string;
  googleMapsUrl: string;
}

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category: "interior" | "exterior" | "coffee" | "food" | "atmosphere";
}
```

Kenapa data dipisah dari UI: kalau harga/menu berubah, cukup edit `data/menu.ts` tanpa menyentuh component.

---

## 4. Rendering Strategy

- Semua halaman utama (`Home`, `Menu`, `About`, `Gallery`, `Location`) menggunakan **Static Rendering** — konten jarang berubah, cocok untuk SEO & performa.
- Gunakan **Server Components** secara default; hanya komponen dengan interaktivitas (navbar mobile toggle, gallery filter) yang jadi **Client Component** (`"use client"`).
- Hindari fetch data di client jika tidak perlu — data statis langsung di-import dari `data/`.

---

## 5. SEO Architecture

- **Metadata API** per halaman (`export const metadata` atau `generateMetadata`)
- **Open Graph** di root layout + override per halaman jika perlu
- **`sitemap.ts`** — generate otomatis dari daftar route
- **`robots.ts`** — instruksi crawling
- **Structured Data (JSON-LD)** — schema `CafeOrCoffeeShop` di root layout, berisi nama, alamat, jam, telepon, sosmed
- **Semantic HTML** wajib: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` — bukan `<div>` semua

---

## 6. Image Strategy

- Semua gambar pakai `next/image` — auto optimization, lazy loading, responsive
- Set `width`/`height` atau `aspect-ratio` eksplisit untuk mencegah layout shift (CLS)
- Foto asli cafe, bukan stock image — sesuai requirement brand authenticity

---

## 7. Styling Convention

- Tailwind config diisi custom color tokens sesuai design system (charcoal, off-white, terracotta, coffee-brown, latte-cream) — bukan hardcode hex di tiap component
- Spacing & typography scale konsisten lewat Tailwind theme extension
- Mobile-first: base style untuk mobile, breakpoint (`md:`, `lg:`) untuk tablet/desktop

---

## 8. Batasan Arsitektur Versi Gratis

- Tidak ada database — semua data statis (in-code)
- Tidak ada authentication/dashboard
- Reservasi = link WhatsApp, bukan sistem booking
- Perubahan konten (menu, harga, foto) = lewat kode, oleh developer

Arsitektur ini didesain agar **migrasi ke Phase 2** (CMS/database/dashboard) tidak butuh rewrite total — cukup ganti sumber data dari `data/*.ts` ke API/database, karena component sudah terpisah dari data sejak awal.