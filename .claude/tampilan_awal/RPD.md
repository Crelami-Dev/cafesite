# RPD — Requirement & Product Document
## Project: CafeSite

---

## 1. Ringkasan Project

Website resmi cafe sebagai digital presence utama. Bukan sekadar landing page — dirancang untuk membawa user dari Instagram → website → datang ke cafe (reservasi/inquiry via WhatsApp).

**Konsep visual:** Minimalist — Premium — Warm — Modern — Authentic
**Target:** Terlihat seperti production website buatan fullstack developer, bukan template AI-generated.

---

## 2. Tujuan Bisnis

- Memberi calon pelanggan info lengkap (menu, suasana, lokasi) sebelum datang
- Mengarahkan traffic Instagram → website → WhatsApp/Maps
- Membangun identitas brand yang konsisten secara visual
- Menjadi pondasi untuk fitur berbayar di Phase 2 (dashboard, reservasi, dsb.)

---

## 3. Target User

- Calon pelanggan yang menemukan cafe lewat Instagram, mayoritas mengakses via smartphone
- User yang ingin cek menu/harga sebelum datang
- User yang mencari lokasi & jam operasional

---

## 4. Scope — Versi Gratis (MVP)

**Included:**
- Home, Menu, About, Gallery, Location, Contact/Reservation (via WA)
- Instagram & Google Maps integration
- Responsive mobile-first
- SEO basic (metadata, sitemap, robots.txt, structured data)
- Performance optimization
- Deployment

**Not included (Phase 2):**
- Admin dashboard, login, database
- Online ordering, payment gateway
- Sistem reservasi
- CMS / automatic content management

---

## 5. Struktur Halaman

| Halaman | URL | Fungsi Utama |
|---|---|---|
| Home | `/` | First impression, funnel ke semua halaman lain |
| Menu | `/menu` | Info menu lengkap by kategori (Coffee, Non-Coffee, Food, Snack, Dessert) |
| About | `/about` | Cerita & identitas brand |
| Gallery | `/gallery` | Foto interior/exterior/suasana |
| Location | `/location` | Alamat, jam operasional, maps, kontak |
| Contact/Reservation | (section) | CTA ke WhatsApp |

---

## 6. Design System

**Warna:**
| Role | Nama | Hex | Porsi |
|---|---|---|---|
| Primary | Charcoal Black | `#20201E` | 60% |
| Text | Warm Off-White | `#F1EEE8` | 25% |
| Accent | Terracotta | `#A6533F` | 10% |
| Secondary | Coffee Brown | `#70483A` | 5% |
| Supporting | Latte Cream | `#C8A98A` | aksen |

**Prinsip:** warna dipakai secukupnya, biar terasa jadi bagian dari brand cafe — bukan sekadar "website warna kopi".

---

## 7. Kriteria Sukses (Definition of Done)

1. **Looks Good** — visual merepresentasikan karakter cafe, foto asli (bukan stock)
2. **Works Well** — responsive di mobile/tablet/desktop, cepat, accessible
3. **Built Properly** — TypeScript, component-based, maintainable, SEO-ready

**Target performa (perlu disepakati lebih lanjut):**
- Lighthouse score > 90 (semua kategori)
- LCP < 2.5s di mobile
- Tidak ada layout shift signifikan (CLS rendah)

---

## 8. Konten yang Dibutuhkan dari Client (sebelum development)

- [ ] Logo (vector, transparent bg)
- [ ] Warna brand final
- [ ] Font pilihan (jika ada preferensi)
- [ ] Foto asli cafe (interior, exterior, produk) — resolusi tinggi
- [ ] Data menu lengkap + harga
- [ ] Alamat lengkap
- [ ] Jam operasional
- [ ] Link Instagram
- [ ] Nomor WhatsApp
- [ ] Link/embed Google Maps

> Panduan pengumpulan foto: `PHOTO_BRIEF.md`. Pegangan tone copywriting: `BRAND_VOICE.md`.

---

## 9. Risiko & Catatan

- **Kualitas foto dari client** sering jadi bottleneck — perlu diarahkan dari awal (briefing foto atau bantuan sesi foto).
- **Menu di static data** berarti perubahan harga/menu harus lewat developer — perlu di-set ekspektasi ke client sejak awal.
- **Reservasi via WA tanpa sistem** bisa jadi chaos kalau cafe ramai — jadi alasan natural upsell ke Phase 2.

---

## 10. Roadmap Phase 2 (Berbayar)

- Admin Dashboard (`/dashboard`) — CRUD menu, gallery, promo
- Sistem reservasi
- Online ordering
- Database + authentication
- CMS untuk owner cafe
- Analytics dashboard