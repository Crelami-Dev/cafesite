# AGENTS.md
## Panduan untuk AI Coding Agent — Project CafeSite

Dokumen ini adalah konteks wajib dibaca sebelum agent (Claude Code atau sejenis) mengerjakan task apapun di repo ini. Rujuk juga `RPD.md`, `TASK.md`, `ARSITEKTUR.md`, `BRAND_VOICE.md`, dan `PHOTO_BRIEF.md` di root project.

---

## 1. Konteks Project

Website cafe (Next.js + TypeScript + Tailwind) dengan tujuan bisnis: membawa user dari Instagram → website → WhatsApp/Maps → datang ke cafe. Visual harus terasa premium, hangat, dan autentik — **bukan template generik AI-generated**.

Baca `RPD.md` untuk requirement lengkap sebelum mengerjakan fitur baru.

---

## 2. Aturan Kerja

- **Jangan mulai coding sebelum requirement konten jelas.** Kalau data menu/foto/warna brand belum ada, gunakan placeholder yang jelas ditandai (`// TODO: ganti dengan data asli client`) — jangan diam-diam pakai data fiktif permanen.
- **Ikuti struktur folder di `ARSITEKTUR.md`.** Jangan taruh logic besar langsung di `page.tsx`.
- **Data dan UI harus terpisah.** Perubahan menu/harga hanya boleh terjadi di `data/menu.ts`, bukan di dalam component.
- **Update `TASK.md`** setiap menyelesaikan sub-task — tandai checklist yang relevan.
- **Jangan tambah dependency baru** tanpa alasan kuat. Stack sudah ditentukan: Next.js, TypeScript, Tailwind, `next/image`, `next/font`. Hindari library berat yang tidak perlu (prinsip performance-first).

---

## 3. Konvensi Kode

- **TypeScript strict** — semua props, data, dan return type harus punya tipe eksplisit lewat `types/index.ts`.
- **Komponen:** PascalCase, satu komponen per file (`Hero.tsx`, `MenuItemCard.tsx`).
- **Server Component by default.** Tambahkan `"use client"` hanya kalau ada interaktivitas (state, event handler, hooks).
- **Semantic HTML wajib** — gunakan `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, bukan `<div>` untuk semuanya.
- **Semua gambar** pakai `next/image` dengan `alt` yang deskriptif (bukan generic seperti "image1.jpg").
- **Styling** hanya lewat Tailwind utility classes + token warna yang sudah didefinisikan di `tailwind.config` — jangan hardcode hex color di JSX.
- **Mobile-first**: tulis style dasar untuk mobile, lalu override dengan `md:`/`lg:` untuk layar lebih besar.

---

## 4. Yang Harus Selalu Dicek Sebelum Selesai Task

- [ ] Apakah semantic HTML sudah dipakai dengan benar?
- [ ] Apakah semua gambar punya `alt` text yang relevan?
- [ ] Apakah layout tidak overflow horizontal di mobile (375px)?
- [ ] Apakah tidak ada layout shift dari gambar (width/height/aspect-ratio sudah diset)?
- [ ] Apakah metadata (title/description) sudah diisi kalau menyentuh halaman baru?
- [ ] Apakah warna yang dipakai strictly mematuhi sistem 3 warna (Charcoal, Off-White, Terracotta), bukan hex manual atau warna baru?

---

## 5. Aturan Sistem Desain (Disiplin 3 Warna) & FigCraft

Semua implementasi visual (baik di FigCraft maupun di kode JSX) WAJIB mematuhi dokumen lengkap di [`.agents/DESIGN_SYSTEM_RULES.md`](.agents/DESIGN_SYSTEM_RULES.md).

### 5.1. Formula 3 Warna Wajib (60 - 30 - 10)
- **60% Charcoal Black (`#20201E`)** — Latar kanvas utama, navbar, footer, card surface (`bg-charcoal`, `charcoal-light`).
- **30% Warm Off-White (`#F1EEE8`)** — Teks heading, paragraf, garis pemisah halus (border), dan kontras kartu terang (`text-offwhite`, `border-offwhite/*`).
- **10% Terracotta Brick (`#A6533F`)** — Warna pendukung katalis pop: Tombol aksi utama (CTA), active state, badge operasional, aksen visual (`bg-terracotta`, `text-terracotta`).
- **PANTANGAN:** DILARANG menambah warna ke-4 ke palet visual. Variasi kedalaman hanya boleh menggunakan tingkat kontras/surface atau opacity dari Charcoal dan Off-White.

### 5.2. Alur FigCraft / Figma-to-Code
- FigCraft desktop terhubung melalui loopback port `47800` (`127.0.0.1:47800`).
- Semua frame utama dibuat berpasangan: **Desktop 1440px** dan **Mobile 390px** dengan auto-layout penuh.
- Dilarang menginstal paket icon baru — gunakan ikon dari `src/components/ui/icons.tsx`.
- Validasi tampilan kode terhadap tampilan FigCraft 1:1 sebelum menandai task selesai.

---

## 6. Batasan — Jangan Ditambahkan Tanpa Diminta Eksplisit

Fitur-fitur ini masuk **Phase 2 (berbayar)** dan TIDAK boleh diimplementasikan di versi gratis kecuali diminta secara eksplisit:

- Admin dashboard / login / authentication
- Database (Supabase, dsb.)
- Sistem reservasi (booking dengan slot/kalender)
- Online ordering / payment gateway
- CMS untuk owner cafe mengubah konten sendiri

Kalau ada request yang mengarah ke fitur-fitur di atas, tanyakan dulu ke user apakah ini scope Phase 2 atau memang mau dipercepat.

---

## 7. Referensi Cepat

| Butuh info soal... | Baca file |
|---|---|
| Requirement bisnis, target user, kriteria sukses | `RPD.md` |
| Aturan Sistem Desain & Disiplin 3 Warna | `.agents/DESIGN_SYSTEM_RULES.md` |
| Task apa yang harus dikerjakan & urutannya | `TASK.md` |
| Struktur folder, data model, rendering strategy | `ARSITEKTUR.md` |
| Tone & suara copywriting | `BRAND_VOICE.md` |
| Spesifikasi & brief foto dari client | `PHOTO_BRIEF.md` |
| Aturan kerja & konvensi kode | `AGENTS.md` (dokumen ini) |

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
