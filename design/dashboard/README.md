# Desain Dashboard Operasional CafeSite (FigCraft & Adaptasi Skill)

Dokumen ini mencatat spesifikasi visual pasangan artboard FigCraft (`1440px` Desktop & `390px` Mobile) di `design/dashboard/cafesite-dashboard-v1.figcraft` (dibangkitkan ulang secara deterministik melalui `scripts/dashboard-design.py`) serta penyesuaian aturan skill `design-taste-frontend` untuk kebutuhan aplikasi dashboard operasional internal.

---

## 1. Pasangan Artboard FigCraft (`1440px` & `390px`)

Setiap modul dan state utama dirancang berpasangan dengan jarak `80px` (`x=0` untuk Desktop `1440px`, `x=1520` untuk Mobile `390px`):

| Indeks | Halaman / Modul | Route | Fokus Utama Desktop (`1440px`) | Fokus Utama Mobile (`390px`) |
|---|---|---|---|---|
| `0` | **Ringkasan** | `/dashboard` | Sidebar `240px`, 4 kartu metrik (`tabular-nums`), panel pesanan aktif & akses cepat, status bot | Kartu utama penjualan lunas penuh (`bg-offwhite text-charcoal`), metrik operasional ringkas, navigasi bawah 4 slot |
| `1` | **Pesanan** | `/dashboard/orders` | Toolbar pencarian & tanggal, papan kanban 3 kolom (`Menunggu`, `Diproses`, `Siap`), riwayat terpisah | Pemilih tab status dengan jumlah pesanan, daftar kartu 1 kolom, detail pelanggan/item layar penuh |
| `2` | **Menu kedai** | `/dashboard/menu` | Pencarian & filter kategori/ketersediaan, grup kategori, baris menu dengan foto/harga/status | Filter 1 kolom, baris menu dengan tombol urut naik/turun `≥44px` ramah sentuhan & keyboard |
| `3` | **Meja & QR** | `/dashboard/tables` | Tab lantai, grid meja 4 kolom dengan status & tautan pesanan aktif, modal QR & cetak lantai/semua | Tab lantai geser, grid meja responsif, aksi lihat QR / bersihkan meja `≥44px` |
| `4` | **WhatsApp Bot** | `/dashboard/wa-bot` | Panel koneksi & pairing QR, kontrol layanan, unggah dokumen RAG `.pdf`/`.md`, tabel progres | Panel koneksi 1 kolom, unggah dokumen, daftar status dokumen dengan tombol proses ulang/hapus |
| `5` | **Info kafe** | `/dashboard/cafe` | Form 2 kolom identitas, kontak, tautan Maps/Instagram, jam buka 7 hari, pratinjau & simpan | Form 1 kolom dengan bar simpan lengket (`sticky bottom-0`) aman dari keyboard & safe area |
| `6` | **Galeri** | `/dashboard/gallery` | Daftar foto dengan thumbnail, unggah foto ke penyimpanan persisten, form judul/alt/kategori/rasio | Daftar foto ringkas, tombol urut/edit/hapus `≥44px`, modal tambah/edit |
| `7` | **Testimoni** | `/dashboard/testimonials` | Daftar ulasan nyata (nama, sumber, rating 1–5, tanggal, isi), urutkan/edit/hapus | Kartu ulasan 1 kolom dengan kontrol urutan dan dialog form |
| `8` | **FAQ** | `/dashboard/faq` | Daftar pertanyaan & jawaban yang langsung disinkronkan ke Beranda dan halaman Lokasi | Daftar 1 kolom, modal tambah/edit pertanyaan |
| `9` | **Panduan lokasi** | `/dashboard/location` | Daftar panduan parkir, patokan, dan transportasi dengan pilihan ikon SVG internal | Daftar 1 kolom dengan ikon internal dan modal form |
| `10` | **Laporan** | `/dashboard/reports` | Filter cepat (`Hari ini`, `7 hari`, `30 hari`, rentang khusus), 4 metrik, tren harian WIB, menu terlaris, CSV | Filter tanggal 1 kolom, kartu metrik, bar tren harian & daftar menu terlaris |
| `11` | **Akses tim** | `/dashboard/team` | Daftar akun staf, status aktif/nonaktif, matriks izin modul, reset password sementara | Daftar staf 1 kolom, dialog pengaturan izin modul & kata sandi sementara |
| `12` | **Form dan status** | Semua route | Spesifikasi input, validasi, peringatan perubahan belum disimpan (`dirty`), state loading/kosong/gagal/berhasil | Spesifikasi dialog layar penuh mobile, focus trap, `Escape`, dan pengembalian fokus |

---

## 2. Penyesuaian Aturan `design-taste-frontend` untuk Dashboard Operasional

Sesuai instruksi perombakan dashboard, prinsip kualitas dari `design-taste-frontend` dan `.agents/DESIGN_SYSTEM_RULES.md` diterapkan dengan penyesuaian khusus aplikasi dinamis:

1. **Disiplin 3 Warna (60 - 30 - 10) Dipertahankan Penuh:**
   - **60% Charcoal (`#20201E`, `#141413`, `#2C2C29`)** untuk kanvas kerja, sidebar, permukaan kartu, dan dialog.
   - **30% Warm Off-White (`#F1EEE8`, `#C5BFB2`, `#A8A295`)** untuk tipografi, garis batas halus (`border-offwhite/10`), serta kartu metrik utama pada Ringkasan.
   - **10% Terracotta (`#A6533F`, `#8E4230`, `#C46B55`)** khusus untuk satu aksi utama per halaman, indikator halaman aktif, badge antrean menunggu, dan pesan peringatan.
   - Tidak ada warna keempat, `backdrop-blur`, gradasi dekoratif, atau `animate-pulse`.
2. **Tipografi & Keterbacaan Angka:**
   - `Playfair Display` (`font-serif`) untuk judul halaman (`<h1>`) dan kepala bagian (`<h2>`).
   - `Plus Jakarta Sans` (`font-sans`) untuk seluruh angka, harga, formulir, tabel, tombol, dan navigasi.
   - Seluruh nominal rupiah, penghitung antrean, waktu, dan metrik wajib memakai `tabular-nums` dan tidak terpotong (`break-words` tanpa `truncate` pada nominal).
3. **Aksesibilitas Status & Target Sentuh:**
   - Setiap status memiliki **ikon + label teks** (`◷ Menunggu`, `↻ Diproses`, `✓ Siap`, `✓ Sudah lunas`, `○ Belum dibayar`, `✓ Tersedia`, `● Terisi`, `↻ Perlu dibersihkan`) sehingga tidak bergantung pada warna saja.
   - Seluruh tombol interaktif, tautan navigasi, pemilih status, dan kontrol urutan naik/turun memiliki tinggi minimal `44px` (`min-h-11`).
   - Seluruh dialog/drawer memiliki focus trap, dukungan tombol `Escape`, dan pengembalian fokus ke elemen pemicu.
4. **Aturan Halaman Promosi yang Dikecualikan secara Sengaja:**
   - **Tanpa Hero Promosi & Tanpa Aturan 1-Section-1-Layar (`100svh`):** Dashboard adalah alat kerja kasir/staf yang harus langsung menampilkan metrik, filter, dan antrean pesanan tanpa harus menggulir melewati banner promosi.
   - **Tanpa Efek Dekoratif / Moments Scroll:** Kecepatan pembacaan data dan stabilitas tata letak (`CLS = 0`) saat polling 5 detik diutamakan.
   - **Tanpa Static Export (`output: 'export'`):** Dashboard membutuhkan Route Handlers dinamis (`/api/admin/*`), sesi cookie `HttpOnly`, dan database SQLite (`node:sqlite`).

