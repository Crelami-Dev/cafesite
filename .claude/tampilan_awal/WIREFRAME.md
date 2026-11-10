# WIREFRAME.md
## Low-Fidelity Wireframes — CafeSite
**Konsep Layout:** Mobile-First (375px) dengan adaptasi Tablet (768px) & Desktop (1440px).  
**Prinsip Desain:** Semantic HTML (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`), bebas horizontal overflow di 375px, dan penempatan komponen konversi strategis.

---

## 1. Komponen Konversi Lintas Halaman (Global Conversion Elements)

Sebelum masuk ke detail halaman, 4 komponen konversi ini hadir secara konsisten:
1. **`[● BUKA SEKARANG]` (OpenNow Badge):** Indikator real-time jam buka/tutup kafe, hadir di Navbar & Section Jam Operasional.
2. **`[ WA ]` (FloatingWhatsApp Button):** Tombol melayang di pojok kanan bawah (`bottom-20 right-4 md:bottom-6 md:right-6`) dengan deep link otomatis: `https://wa.me/628xxx?text=Halo%20CafeSite,%20saya%20mau%20tanya/reservasi...`.
3. **`[ BAR CTA BAWAH ]` (StickyMobileCTA):** Bar lengket di layar paling bawah khusus mobile (<768px) dengan 2 aksi utama: `[ Lihat Menu ]` dan `[ Chat WhatsApp ]`.
4. **Semantic Layout Root:** `<header>` (Navbar) → `<main>` (Isi Halaman) → `<footer>` (Footer) + Floating CTA.

---

## 2. Wireframe Halaman 1: HOME (`/`) — Detail Ekstra

### Tampilan Mobile (375px viewport) vs Adaptasi Desktop (1440px viewport)

```
================================== 375px (MOBILE) ==================================
<header>
+----------------------------------------------------------------------------------+
| [LOGO CafeSite]                  [● BUKA]                     [ [=] MENU HAMBURGER] |
+----------------------------------------------------------------------------------+
</header>

<main>
<section id="hero">
+----------------------------------------------------------------------------------+
| (BACKGROUND FOTO: Interior Warm & Barista Seduh - Aspect 4:5 / 1:1)               |
|                                                                                  |
| [Tagline: "Kopi yang Diseduh Pelan-Pelan"]                                       |
| <h1>Ruang yang Terasa Milik Kamu.</h1>                                           |
| <p>Mampir sebentar untuk rehat dari rutinitas. Nikmati seduhan hangat            |
|    dan sudut duduk yang tenang di pusat kota.</p>                                |
|                                                                                  |
| [ Tombol: LIHAT MENU ] (Primary Terracotta - Full Width)                         |
| [ Tombol: PETUNJUK ARAH ] (Secondary Outline - Full Width)                       |
+----------------------------------------------------------------------------------+
</section>

<section id="highlights">
+----------------------------------------------------------------------------------+
| <h2>Mengapa di CafeSite?</h2>                                                    |
|                                                                                  |
| [Icon] Biji Kopi Kurasi                                                          |
|        Single origin Nusantara pilihan disangrai berkala.                        |
| -------------------------------------------------------------------------------- |
| [Icon] Ruang Nyaman WFC                                                          |
|        Wi-Fi stabil & colokan listrik di hampir setiap meja.                     |
| -------------------------------------------------------------------------------- |
| [Icon] Seduhan Artisanal                                                         |
|        Manual brew presisi & racikan espresso seimbang.                          |
| -------------------------------------------------------------------------------- |
| [Icon] Suasana Menenangkan                                                       |
|        Pencahayaan hangat tanpa musik bising, pas untuk obrolan.                 |
+----------------------------------------------------------------------------------+
</section>

<section id="featured-menu">
+----------------------------------------------------------------------------------+
| <span>PILIHAN TERFAVORIT</span>                                                  |
| <h2>Menu Unggulan Kami</h2>                                                      |
|                                                                                  |
| <article class="menu-card">                                                      |
|   [FOTO MENU: Aspect 1:1] (next/image)                                           |
|   <h3>Caramel Macchiato</h3>                           [Rp 28.000]               |
|   <p>Espresso kaya rasa dipadu steamed milk lembut dan saus caramel.</p>         |
|   <span class="badge">Best Seller</span>                                         |
| </article>                                                                       |
|                                                                                  |
| <article class="menu-card">                                                      |
|   [FOTO MENU: Aspect 1:1]                                                        |
|   <h3>Truffle Fries</h3>                               [Rp 25.000]               |
|   <p>Kentang goreng gurih renyah dengan aroma minyak truffle aromatik.</p>        |
|   <span class="badge">Favorit Tamu</span>                                        |
| </article>                                                                       |
|                                                                                  |
| [ Tombol: LIHAT SEMUA MENU (5 Kategori) -> ] (Outline Terracotta)                |
+----------------------------------------------------------------------------------+
</section>

<section id="about-preview">
+----------------------------------------------------------------------------------+
| [FOTO: Sudut Bar Cafe / Brewer]                                                  |
| <span>TENTANG KAMI</span>                                                        |
| <h2>Cerita di Balik Setiap Cangkir</h2>                                          |
| <p>CafeSite berawal dari keinginan sederhana: menghadirkan tempat singgah        |
|    yang jujur bagi pecinta kopi. Bukan sekadar kafe cepat saji...</p>            |
| [ Link: BACA CERITA SELENGKAPNYA -> ]                                            |
+----------------------------------------------------------------------------------+
</section>

<section id="gallery-preview">
+----------------------------------------------------------------------------------+
| <span>SUDUT SUASANA</span>                                                       |
| <h2>Galeri CafeSite</h2>                                                         |
| [Foto 1: Interior]   [Foto 2: Latte Art]                                         |
| [Foto 3: Outdoor]    [Foto 4: Plating Food]                                      |
| [ Tombol: JELAJAHI SEMUA FOTO -> ]                                               |
+----------------------------------------------------------------------------------+
</section>

<section id="reviews">
+----------------------------------------------------------------------------------+
| <span>KATA MEREKA</span>                                                         |
| <h2>Ulasan Pengunjung</h2>                                                       |
|                                                                                  |
| <article class="review-card">                                                    |
|   "Tempat paling tenang buat kerja di sore hari. Flat white-nya                  |
|    konsisten enak dan baristanya ramah banget."                                  |
|   <strong>— Dimas A. (Google Review ★★★★★)</strong>                              |
| </article>                                                                       |
+----------------------------------------------------------------------------------+
</section>

<section id="location-cta">
+----------------------------------------------------------------------------------+
| <h2>Mampir Hari Ini?</h2>                                                        |
| <p>Buka Hari Ini: 08:00 - 22:00 (Last order 21:30)</p>                            |
| <p>Jl. Kopi No. 12, Pusat Kota</p>                                               |
|                                                                                  |
| [ Tombol: BUKA GOOGLE MAPS ] (Aksi Navigasi)                                     |
| [ Tombol: CHAT VIA WHATSAPP ] (Deep Link WA Auto-text)                           |
+----------------------------------------------------------------------------------+
</section>
</main>

<footer>
+----------------------------------------------------------------------------------+
| [LOGO CafeSite]                                                                  |
| Navigasi: Home · Menu · About · Gallery · Location                               |
| Instagram: @CafeSite · WhatsApp: +62 8xx-xxxx-xxxx                               |
| (c) 2026 CafeSite. All rights reserved.                                          |
+----------------------------------------------------------------------------------+
</footer>

<!-- Komponen Fixed -->
[ (WA) Floating Button ]  --> Pojok Kanan Bawah (z-40)
[ STICKY MOBILE CTA: [Lihat Menu] | [Chat WhatsApp] ] --> Lengket di Bawah Layar (z-50)
```

```
================================== 1440px (DESKTOP NOTE) ==================================
Navbar:
+----------------------------------------------------------------------------------------+
| [LOGO CafeSite]   [Home] [Menu] [About] [Gallery] [Location]    [● BUKA]  [Tombol: WA] |
+----------------------------------------------------------------------------------------+

Hero: 2 Kolom (Split Layout)
[ Kiri (55%): Headline H1 + Subcopy + 2 Tombol CTA sejajar ] | [ Kanan (45%): Foto Hero ]

Highlights: Grid 4 Kolom Horizontal Sejajar [ Col 1 ] [ Col 2 ] [ Col 3 ] [ Col 4 ]

Featured Menu: Grid 3 Kolom Kartu Menu sejajar [ Kartu 1 ] [ Kartu 2 ] [ Kartu 3 ]

About Preview: 2 Kolom (Kiri: Foto Komposisi / Kanan: Narasi + Link About)

Gallery Preview: Grid 4 Kolom Foto Estetik

Reviews: Grid 3 Kolom Testimoni Sejajar

Location CTA: Box Terracotta Kontras dengan Info Jam + Tombol Maps & WA Berdampingan
StickyMobileCTA: Tersembunyi otomatis di desktop (display: hidden md:hidden).
FloatingWhatsApp: Tetap aktif melayang di kanan bawah desktop.
```

---

## 3. Wireframe Halaman 2: MENU (`/menu`) — Detail Ekstra

### Tampilan Mobile (375px) vs Desktop (1440px)

```
================================== 375px (MOBILE) ==================================
<header> Navbar (Logo, Navigasi, OpenNow) </header>

<main>
<section id="menu-header">
+----------------------------------------------------------------------------------+
| <span>DAFTAR HARGA & PILIHAN</span>                                              |
| <h1>Daftar Menu CafeSite</h1>                                                    |
| <p>Dibuat dari bahan segar dan diseduh dengan standar rasa tinggi.               |
|    Tersedia opsi susu nabati (Oat Milk) untuk minuman kopi.</p>                  |
+----------------------------------------------------------------------------------+
</section>

<!-- Sticky Sub-Navigation: Kategori Menu (Bisa di-scroll horizontal) -->
<nav id="category-anchors" class="sticky top-16 z-30 bg-charcoal">
+----------------------------------------------------------------------------------+
| [ #Coffee ]  [ #Non-Coffee ]  [ #Food ]  [ #Snack ]  [ #Dessert ]  (Swipe --->)  |
+----------------------------------------------------------------------------------+
</nav>

<section id="coffee">
+----------------------------------------------------------------------------------+
| <h2>☕ Coffee</h2>                                                               |
| <p>Single origin pilihan & house blend racikan khusus.</p>                       |
|                                                                                  |
| <article class="menu-item-card">                                                 |
|   <div class="card-thumb">[Foto 1:1]</div>                                       |
|   <div class="card-body">                                                        |
|     <div class="row-header">                                                     |
|       <h3>Americano</h3>                             <strong>22k</strong>        |
|     </div>                                                                       |
|     <p>Espresso double shot dengan air murni panas/dingin.</p>                   |
|     <span class="tag">Espresso Based</span>                                      |
|   </div>                                                                         |
| </article>                                                                       |
|                                                                                  |
| <article class="menu-item-card">                                                 |
|   <div class="card-thumb">[Foto 1:1]</div>                                       |
|   <div class="card-body">                                                        |
|     <div class="row-header">                                                     |
|       <h3>Caramel Macchiato</h3>                     <strong>28k</strong>        |
|     </div>                                                                       |
|     <p>Steamed milk, vanilla, espresso, drizzled caramel.</p>                    |
|     <span class="badge-featured">Unggulan</span>                                 |
|   </div>                                                                         |
| </article>                                                                       |
|                                                                                  |
| (Daftar item kopi lainnya...)                                                    |
+----------------------------------------------------------------------------------+
</section>

<section id="non-coffee">
+----------------------------------------------------------------------------------+
| <h2>🍵 Non-Coffee</h2>                                                           |
| <article class="menu-item-card">                                                 |
|   <h3>Matcha Latte</h3>                              <strong>26k</strong>        |
|   <p>Pure Uji matcha Jepang dengan fresh milk lembut.</p>                        |
| </article>                                                                       |
+----------------------------------------------------------------------------------+
</section>

<section id="food">
+----------------------------------------------------------------------------------+
| <h2>🍳 Food (Makanan Utama)</h2>                                                 |
| <article class="menu-item-card">                                                 |
|   <h3>Nasi Goreng Kampung</h3>                       <strong>35k</strong>        |
|   <p>Rempah nusantara gurih, suwiran ayam, telur mata sapi.</p>                  |
| </article>                                                                       |
+----------------------------------------------------------------------------------+
</section>

<section id="snack">
+----------------------------------------------------------------------------------+
| <h2>🍟 Snack</h2>                                                                |
| <article class="menu-item-card">                                                 |
|   <h3>Truffle Fries</h3>                             <strong>25k</strong>        |
|   <p>Kentang renyah, minyak truffle wangi, taburan parmesan.</p>                 |
| </article>                                                                       |
+----------------------------------------------------------------------------------+
</section>

<section id="dessert">
+----------------------------------------------------------------------------------+
| <h2>🥐 Dessert & Pastry</h2>                                                     |
| <article class="menu-item-card">                                                 |
|   <h3>Butter Croissant</h3>                          <strong>24k</strong>        |
|   <p>Pastry renyah berlapis dengan wangi butter Prancis autentik.</p>            |
| </article>                                                                       |
+----------------------------------------------------------------------------------+
</section>

<section id="menu-inquiry">
+----------------------------------------------------------------------------------+
| <h3>Punya Kebutuhan Alergi atau Rombongan?</h3>                                  |
| <p>Tanyakan langsung komposisi bahan atau pesan meja untuk grup kamu.</p>        |
| [ Tombol: TANYA MENU VIA WHATSAPP ] (Deep link WA)                               |
+----------------------------------------------------------------------------------+
</section>
</main>

<footer> Footer </footer>
```

```
================================== 1440px (DESKTOP NOTE) ==================================
Layout Menu Desktop:
- Kategori Anchor Bar: Tab navigasi elegan dengan filter yang menempel di bawah navbar saat di-scroll.
- Grid Menu: 2 Kolom berdampingan per kategori:
  [ Item 1: Foto + Teks + Harga ]    [ Item 2: Foto + Teks + Harga ]
  [ Item 3: Foto + Teks + Harga ]    [ Item 4: Foto + Teks + Harga ]
- Transisi mulus antar anchor via CSS smooth scroll (`scroll-mt-24`).
- Tanda "Unggulan" / "Best Seller" terlihat mencolok dengan badge Terracotta.
```

---

## 4. Wireframe Halaman 3: ABOUT (`/about`)

```
================================== 375px (MOBILE) ==================================
<header> Navbar </header>

<main>
<section id="about-hero">
+----------------------------------------------------------------------------------+
| <span>TENTANG KAMI</span>                                                        |
| <h1>Tempat Bertemu Rasa & Waktu yang Tenang</h1>                                 |
| [FOTO HERO: Barista menyeduh kopi dengan cahaya alami jendela]                   |
+----------------------------------------------------------------------------------+
</section>

<section id="our-story">
+----------------------------------------------------------------------------------+
| <h2>Cerita Awal CafeSite</h2>                                                    |
| <p>Didirikan atas kecintaan pada secangkir seduhan jujur, CafeSite hadir         |
|    sebagai oase di tengah hiruk-pikuk kesibukan kota. Kami percaya setiap cangkir|
|    punya cerita yang layak dinikmati tanpa terburu-buru.</p>                     |
+----------------------------------------------------------------------------------+
</section>

<section id="our-philosophy">
+----------------------------------------------------------------------------------+
| <h2>3 Filosofi Kami</h2>                                                         |
| 1. Kualitas Biji Lokal: Mendukung petani kopi nusantara.                         |
| 2. Kerapian Seduh: Ketelitian rasio air dan suhu demi rasa optimal.             |
| 3. Ruang yang Bersahabat: Siapa pun kamu, selalu ada sudut nyaman untukmu.       |
+----------------------------------------------------------------------------------+
</section>

<section id="our-space">
+----------------------------------------------------------------------------------+
| <h2>Ruang yang Didesain untuk Kamu</h2>                                          |
| [FOTO: Sudut Duduk Indoor dengan Meja Kerja & Stopkontak]                        |
| <p>Mulai dari sudut privat untuk fokus menyelesaikan tugas, hingga area outdoor  |
|    rindang untuk bertukar cerita di senja hari.</p>                              |
+----------------------------------------------------------------------------------+
</section>

<section id="about-cta">
+----------------------------------------------------------------------------------+
| <h2>Rasakan Langsung Kehangatannya</h2>                                          |
| [ Tombol: LIHAT LOKASI KAMI ]  [ Tombol: LIHAT DAFTAR MENU ]                     |
+----------------------------------------------------------------------------------+
</section>
</main>
<footer> Footer </footer>
```
*Catatan Desktop (1440px):* Hero menggunakan layout editorial asimetris (Kiri: narasi puitis & hangat, Kanan: foto vertikal artistik). Filosofi disusun dalam 3 kolom seimbang (*card grid*).

---

## 5. Wireframe Halaman 4: GALLERY (`/gallery`)

```
================================== 375px (MOBILE) ==================================
<header> Navbar </header>

<main>
<section id="gallery-header">
+----------------------------------------------------------------------------------+
| <span>SUASANA & MOMEN</span>                                                     |
| <h1>Galeri Sudut CafeSite</h1>                                                   |
| <p>Setiap sudut dirancang untuk kenyamanan mata dan ketenangan pikiran.</p>      |
+----------------------------------------------------------------------------------+
</section>

<!-- Filter Kategori Foto -->
<nav id="gallery-filter-chips">
+----------------------------------------------------------------------------------+
| (• Semua)  ( Interior )  ( Eksterior )  ( Kopi & Menu )  ( Suasana )             |
+----------------------------------------------------------------------------------+
</nav>

<section id="gallery-grid">
+----------------------------------------------------------------------------------+
| [ Foto 1: Suasana Barista & Bar Kopi ] (Aspect 4:5)                              |
| [ Foto 2: Sudut Seating Outdoor Senja ] (Aspect 16:9)                            |
| [ Foto 3: Latte Art Detail ] (Aspect 1:1)                                        |
| [ Foto 4: Area Kerja Laptop & Wi-Fi ] (Aspect 4:5)                               |
| [ Foto 5: Plating Makanan Utama ] (Aspect 1:1)                                   |
| [ Foto 6: Tampak Depan / Signage CafeSite ] (Aspect 16:9)                        |
+----------------------------------------------------------------------------------+
</section>

<section id="instagram-cta">
+----------------------------------------------------------------------------------+
| <h3>Bagikan Momen Kamu</h3>                                                      |
| <p>Tag akun kami <strong>@CafeSite</strong> di Instagram Stories kamu.</p>        |
| [ Tombol: BUKA INSTAGRAM @CafeSite ]                                             |
+----------------------------------------------------------------------------------+
</section>
</main>
<footer> Footer </footer>
```
*Catatan Desktop (1440px):* Galeri dirender menggunakan sistem grid 3–4 kolom dengan layout masonry adaptif. Setiap gambar memiliki `aspect-ratio` terdefinisi dan `alt` text deskriptif untuk mencegah CLS (Cumulative Layout Shift) dan memperkuat SEO gambar.

---

## 6. Wireframe Halaman 5: LOCATION & CONTACT (`/location`)

```
================================== 375px (MOBILE) ==================================
<header> Navbar </header>

<main>
<section id="location-header">
+----------------------------------------------------------------------------------+
| <span>PETUNJUK ARAH & KONTAK</span>                                              |
| <h1>Kunjungi CafeSite</h1>                                                       |
| <p>Kami siap menyambut kehadiranmu setiap hari.</p>                              |
| [● BUKA SEKARANG: Tutup pukul 22:00]                                             |
+----------------------------------------------------------------------------------+
</section>

<section id="operating-hours">
+----------------------------------------------------------------------------------+
| <h2>Jam Operasional</h2>                                                         |
| +------------------------------------------------------------------------------+ |
| | Senin – Kamis       : 08:00 – 22:00 (Last order 21:30)                       | |
| | Jumat               : 08:00 – 23:00 (Last order 22:30)                       | |
| | Sabtu               : 07:00 – 23:00 (Last order 22:30)                       | |
| | Minggu              : 07:00 – 22:00 (Last order 21:30)                       | |
| +------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------+
</section>

<section id="map-embed">
+----------------------------------------------------------------------------------+
| <h2>Peta Lokasi</h2>                                                             |
| [ INTERACTIVE GOOGLE MAPS EMBED / IFRAME LAZY LOADED ]                           |
| <p>Alamat: Jl. Kopi No. 12, Pusat Kota, Kota Anda</p>                           |
| <p>Patokan: 100m di timur perempatan lampu merah, seberang taman kota.</p>       |
| [ Tombol: BUKA DI GOOGLE MAPS APP ] (Navigasi GPS Langsung)                      |
+----------------------------------------------------------------------------------+
</section>

<section id="contact-methods">
+----------------------------------------------------------------------------------+
| <h2>Hubungi Kami</h2>                                                            |
| <article class="contact-box">                                                    |
|   <strong>WhatsApp Reservasi / Info:</strong>                                   |
|   <p>+62 8xx-xxxx-xxxx</p>                                                       |
|   [ Tombol: KIRIM PESAN WHATSAPP ] (Pre-filled text: Reservasi meja)             |
| </article>                                                                       |
| <article class="contact-box">                                                    |
|   <strong>Instagram:</strong>                                                    |
|   <p>@CafeSite</p>                                                               |
|   [ Tombol: LIHAT INSTAGRAM ]                                                    |
| </article>                                                                       |
+----------------------------------------------------------------------------------+
</section>

<section id="faq">
+----------------------------------------------------------------------------------+
| <h2>Pertanyaan yang Sering Diajukan (FAQ)</h2>                                   |
|                                                                                  |
| [?] Apakah tersedia koneksi Wi-Fi dan colokan listrik?                           |
| [v] Ya, Wi-Fi berkecepatan tinggi dan stopkontak tersedia di hampir semua meja.  |
| -------------------------------------------------------------------------------- |
| [?] Apakah bisa reservasi meja untuk rombongan?                                  |
| [v] Bisa! Chat kami via WhatsApp minimal 3 jam sebelum kedatangan.               |
| -------------------------------------------------------------------------------- |
| [?] Apakah ada area merokok (smoking area)?                                      |
| [v] Tersedia area outdoor yang asri dan terpisah dari ruang indoor ber-AC.       |
| -------------------------------------------------------------------------------- |
| [?] Apakah ramah hewan peliharaan (pet-friendly)?                                |
| [v] Area outdoor kami menyambut hewan peliharaan kecil yang dirantai dengan rapi.|
+----------------------------------------------------------------------------------+
</section>
</main>
<footer> Footer </footer>
```
*Catatan Desktop (1440px):* Section Jam Operasional dan Peta Google Maps berada bersisian dalam layout 2 Kolom (50% - 50%), memudahkan pengunjung melihat jadwal sambil mengecek rute perjalanan. FAQ disajikan dengan accordion interaktif yang rapi.
