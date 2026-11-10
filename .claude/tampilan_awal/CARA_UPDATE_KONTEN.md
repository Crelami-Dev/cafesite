# Cara Update Konten CafeSite

Panduan singkat untuk mengubah teks, harga, jam buka, dan kontak di website
**tanpa perlu menyentuh kode komponen**. Semua data terpusat di folder
`src/data/` — format Data/UI terpisah.

> Ganti lalu push ke `main` (Vercel auto-deploy). Lihat `TASK.md` Phase 14.

## 1. Menu & Harga — `src/data/menu.ts`
- Tiap item punya `name`, `description`, `price` (angka, tanpa titik — format Rp ditambah otomatis), `category`, dan `image` (path file di `public/`).
- Item dengan `isFeatured: true` muncul di halaman depan (maks 3).
- Tambah foto: taruh file di `public/Image/Menu/...` lalu isi `image: "/Image/Menu/nama_file.png"`.

## 2. Info Kafe (alamat, jam, kontak) — `src/data/cafe.ts`
- `address`, `city`, `landmark` — tampil di footer, halaman lokasi, home.
- `openingHours` — 7 baris. Format `"08:00 – 22:00"`, `openTime`/`closeTime` dalam 24 jam (dipakai badge "Buka sampai…"), `notes` = catatan per hari.
- `whatsapp` — format internasional tanpa `+` (mis. `6281234567890`). `whatsappFormatted` = tampilan manusia.
- `instagram`, `instagramUrl`, `googleMapsUrl`, `googleMapsEmbedUrl` — link CTA & peta.

## 3. FAQ Lokasi & Transportasi — `src/data/location.ts`
- `transportGuides` — kartu parkir / patokan / angkutan umum.
- `locationFaqs` — pertanyaan jawaban (ikut ke JSON-LD FAQPage untuk Google/AI).

## 4. Ulasan — `src/data/testimonials.ts`
- `name`, `source`, `rating`, `comment`.

## 5. Foto
- Foto baru simpan di `public/` lalu referensikan path-nya di data (bukan di komponen).
- Ukuran disarankan ≤ 300 KB; Vercel otomatis mengoptimalkan via `next/image`.

## 6. SEO / Domain
- `src/config/site.ts` → `SITE_URL`, deskripsi, dan keywords. Ganti `SITE_URL` ke domain kustom kalau sudah punya.

## Publish
```bash
git add .
git commit -m "update konten: ..."
git push origin main
```
Deploy otomatis ~1–2 menit ke https://cafesite-five.vercel.app.

## Batasan versi gratis
Tidak ada admin dashboard, database, atau CMS. Perubahan konten dilakukan
lewat file data di atas. Opsi berbayar (Phase 2) dijelaskan di
`CONTENT_QUESTIONNAIRE.md` §6.