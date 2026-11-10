# PHOTO_BRIEF.md
## Brief Foto untuk Client — Project CafeSite

Tujuan: mengumpulkan **foto asli berkualitas tinggi** untuk website. Kualitas foto = kualitas brand. Dokumen ini dipakai saat pengambilan foto *dan* saat penerimaan asset dari client.

> Foto adalah bottleneck terbesar project ini (lihat `RPD.md` §9). Brief ini dikirim ke client **sebelum** development dimulai agar jadwal tidak molor.

---

## 1. Spesifikasi Teknis (Wajib)

- **Resolusi:** sisi terpanjang minimal 2000px. Website memakai lebar sampai 1600px di desktop dan butuh margin crop.
- **Format:** JPG/JPEG untuk foto, PNG untuk grafis/logo.
- **Aspek rasio yang dibutuhkan (campur):**
  - Landscape 3:2 atau 16:9 — hero & section besar
  - Portrait 4:5 atau 9:16 — grid mobile & stories
  - Square 1:1 — thumbnail menu & OG image
- **Orientasi:** kombinasikan landscape + portrait (grid butuh variasi).
- **Pencahayaan:** cahaya alami pagi/sore; hindari flash keras dan dominasi lampu neon.
- **Jangan:** watermark, teks, stempel tanggal, atau filter berat khas feed Instagram. Kirim versi asli / edit ringan.
- **File tidak perlu dicompress** — `next/image` mengoptimalkan otomatis saat build.

---

## 2. Shot List Wajib

| Kategori | Shot yang dibutuhkan | Kuantitas | Dipakai untuk |
|---|---|---|---|
| Interior | ruang utama, sudut seating (indoor & outdoor), bar/counter, detail dekorasi | 8–12 | Home, Gallery, About |
| Exterior | tampak depan dari jalan (siang & senja/malam), signage/logo | 3–5 | Gallery, Location |
| Coffee | proses seduh (tangan/mesin), close-up latte art, biji & alat seduh | 6–8 | Menu, Home featured |
| Non-Coffee | mocktail, teh, jus, signature drink | 4–6 | Menu |
| Food | main dish (overhead & 45°), plating | 6–10 | Menu, About |
| Snack/Dessert | pastry, dessert cup, snack | 4–6 | Menu |
| Atmosphere | orang menikmati (kandidat), live music, suasana ramai/sepi | 4–6 | About, Gallery |

---

## 3. Per Item Menu

Utamakan setiap menu **unggulan** punya foto sendiri. Minimal: kumpulkan foto per kategori dulu, lalu foto per-item untuk item yang tampil besar di Home.

---

## 4. Format Pengiriman

- Kirim via Google Drive / shared album, **folder per kategori**: `01-interior`, `02-exterior`, `03-coffee`, dst.
- **Nama file deskriptif** — dipakai untuk `alt` text & SEO:
  - Baik: `interior-ruang-utama.jpg`, `coffee-americano-latte.jpg`
  - Buruk: `IMG_2041.jpg`
- Sertakan `info-foto.md`: lokasi & waktu pengambilan, izin orang terlihat (jika ada wajah jelas), kredit fotografer (jika bukan internal).

---

## 5. Checklist Penerimaan (Developer → Client)

- [ ] Akses link Google Drive / cloud storage sudah diset **"Anyone with the link can view / download"** (tidak terkunci / minta akses manual).
- [ ] Format file sesuai spesifikasi (JPG/JPEG untuk foto, PNG/SVG transparan untuk logo/ikon grafis).
- [ ] Semua file resolusi sisi terpanjang ≥ 2000px (tidak pecah saat di-zoom di desktop).
- [ ] Tidak ada watermark, filter berat khas preset medsos, stempel tanggal, atau teks tempelan.
- [ ] Semua kategori di shot list terpenuhi (Interior, Exterior, Coffee, Non-Coffee, Food, Snack/Dessert, Atmosphere).
- [ ] Item menu unggulan (featured / best-seller) memiliki foto tersendiri dengan plating jelas.
- [ ] Variasi orientasi lengkap: Landscape (hero/desktop banner) dan Portrait / Square 1:1 (tampilan mobile & kartu menu).
- [ ] Pencahayaan alami memadai (tidak terlalu gelap/under-exposed, tidak menggunakan flash ponsel langsung).
- [ ] Foto yang menampilkan wajah pengunjung/staf secara jelas sudah memiliki izin lisan/tertulis.
- [ ] Penamaan file deskriptif (contoh: `coffee-latte-art.jpg`) dan tersusun rapi di subfolder kategori.
- [ ] Signage atau elemen branding yang terfoto konsisten dengan logo dan warna brand resmi.

---

## 6. Catatan

- Foto yang tidak memenuhi standar: diskusikan reshoot, atau pakai komposisi terbaik yang ada — **jangan** ganti dengan stock image (melanggar prinsip authenticity di `RPD.md` §7).
- Deadline foto menentukan jadwal development — lihat `TASK.md` Phase 0.
