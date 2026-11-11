"""Reproducible FigCraft screen specifications, one reviewable chunk per frame."""
import json, pathlib, subprocess

root = pathlib.Path("design/dashboard")
root.mkdir(parents=True, exist_ok=True)

pages = {
    "Ringkasan": [
        "Penjualan lunas hari ini · Rp 1.850.000",
        "Pesanan hari ini (24) · Antrean aktif (4) · Meja tersedia (8)",
        "Perlu ditangani · #A-021 Meja L1-03 · ◷ Menunggu",
        "Koneksi WhatsApp · ✓ Terhubung",
    ],
    "Pesanan": [
        "Cari pesanan · Filter tanggal · Suara aktif",
        "◷ Menunggu (2) · ↻ Diproses (1) · ✓ Siap (1)",
        "#A-021 · Meja L1-03 · 4 mnt · Rp 68.000 · Mulai proses",
        "Riwayat selesai & dibatalkan · Pagination 25/halaman",
    ],
    "Menu kedai": [
        "Cari menu · Kategori · Ketersediaan",
        "+ Tambah menu · Kelola Kategori",
        "Foto · Nama menu · Tag · Harga tabular-nums · ✓ Tersedia",
        "Urutkan (↑ / ↓ 44px) · Edit · Hapus",
    ],
    "Meja & QR": [
        "Tab Lantai · + Tambah lantai · Cetak QR lantai / semua",
        "✓ Tersedia · ● Terisi · ↻ Perlu dibersihkan",
        "Meja L1-03 · Pesanan aktif #A-021 · Lihat pesanan ↗",
        "Lihat QR · Unduh PNG/SVG · Cetak satu meja",
    ],
    "WhatsApp Bot": [
        "Koneksi WhatsApp · ✓ Terhubung / ◷ Menunggu scan QR",
        "Hubungkan · Sambung ulang · Putuskan · Keluar & ganti nomor",
        "Unggah dokumen pengetahuan (.pdf / .md maks 10 MB)",
        "Tabel dokumen · ◷ Menunggu / ↻ Diproses / ✓ Selesai / ! Gagal · Proses ulang · Hapus",
    ],
    "Info kafe": [
        "Identitas kedai (Nama, Sapaan)",
        "Kontak & alamat (WhatsApp, Instagram, Google Maps, Embed URL)",
        "Jam operasional 7 hari (Buka/Tutup, Jam buka, Jam tutup, Catatan)",
        "Pratinjau · Simpan perubahan (peringatan perubahan belum disimpan)",
    ],
    "Galeri": [
        "+ Tambah foto · Unggah JPG/PNG/WebP/AVIF maks 5 MB",
        "Pratinjau foto · Judul · Teks alternatif (alt)",
        "Kategori (Interior, Eksterior, Kopi, Makanan, Suasana) · Rasio",
        "Urutkan (↑ / ↓) · Edit · Hapus",
    ],
    "Testimoni": [
        "+ Tambah testimoni (tanpa data fiktif)",
        "Nama pengunjung · Sumber ulasan · Rating (1–5) · Tanggal",
        "Isi testimoni",
        "Urutkan (↑ / ↓) · Edit · Hapus",
    ],
    "FAQ": [
        "+ Tambah pertanyaan",
        "Pertanyaan ringkas",
        "Jawaban jelas & langsung tampil di Beranda dan Lokasi",
        "Urutkan (↑ / ↓) · Edit · Hapus",
    ],
    "Panduan lokasi": [
        "+ Tambah panduan",
        "Pilihan ikon internal (Parkir · Patokan · Transportasi)",
        "Judul · Petunjuk utama · Detail tambahan",
        "Urutkan (↑ / ↓) · Edit · Hapus",
    ],
    "Laporan": [
        "Periode: Hari ini · 7 hari · 30 hari · Rentang tanggal · Ekspor CSV ↓",
        "Penjualan lunas · Pesanan masuk · Transaksi lunas · Rata-rata transaksi",
        "Tren penjualan harian (WIB) · Catatan transaksi waktu perkiraan",
        "Menu terlaris (porsi & pendapatan tabular-nums)",
    ],
    "Akses tim": [
        "+ Tambah staf (khusus pemilik/admin)",
        "Nama · Email · Status ✓ Aktif / ✕ Nonaktif",
        "Izin modul per halaman (baca/tulis terverifikasi di server)",
        "Reset kata sandi sementara · Cabut sesi aktif",
    ],
    "Form dan status": [
        "Label field terlihat · Input min-h 44px · Pesan validasi spesifik",
        "Simpan perubahan (Terracotta #A6533F) · Batal (peringatan bila dirty)",
        "Status: Memuat · Kosong · Berhasil · Gagal + Coba lagi",
        "Dialog & Drawer: Focus trap · Escape · Pengembalian fokus",
    ],
}

target = root / "cafesite-dashboard-v1.figcraft"
if target.exists():
    target.unlink()

next_id = 2
checker = "C:/Users/Pahmi/.codex/skills/figcraft/scripts/check_chunk.py"

for i, (title, rows) in enumerate(pages.items()):
    for w, x in [(1440, 0), (390, 1520)]:
        steps = [
            {
                "command": "node.create",
                "as": "screen",
                "params": {
                    "type": "frame",
                    "name": f"{title} / {w}",
                    "x": x,
                    "y": i * 1100,
                    "width": w,
                    "height": 960,
                    "props": {
                        "fill": "#20201E",
                        "layout": "vertical",
                        "padding": 20 if w == 390 else 40,
                        "gap": 20,
                    },
                },
            }
        ]

        def add_text(parent, value, size=15, family="Plus Jakarta Sans", color="#F1EEE8"):
            steps.append(
                {
                    "command": "node.create",
                    "params": {
                        "type": "text",
                        "parent": {"$ref": parent},
                        "text": value,
                        "props": {
                            "fontFamily": family,
                            "fontSize": size,
                            "fill": color,
                            "sizingH": "fill",
                            "textAutoResize": "height",
                        },
                    },
                }
            )

        add_text(
            "screen",
            "Ruang kelola / CafeSite" if w == 390 else "Sidebar 240px (Kedai · Operasional · Konten · Pengelolaan)  |  Ruang kelola · Lihat website ↗",
            13,
            "Plus Jakarta Sans",
            "#C5BFB2",
        )
        add_text("screen", title, 28 if w == 390 else 36, "Playfair Display", "#F1EEE8")

        for j, row in enumerate(rows):
            is_hero_metric = i == 0 and j == 0
            panel_fill = "#F1EEE8" if is_hero_metric else ("#A6533F" if j == 1 and i in (2, 6, 7, 8, 9, 11) else "#2C2C29")
            text_fill = "#20201E" if is_hero_metric else "#F1EEE8"
            steps.append(
                {
                    "command": "node.create",
                    "as": f"panel{j}",
                    "params": {
                        "type": "frame",
                        "parent": {"$ref": "screen"},
                        "name": row[:48],
                        "height": 124,
                        "props": {
                            "layout": "vertical",
                            "sizingH": "fill",
                            "fill": panel_fill,
                            "cornerRadius": 12,
                            "padding": 20,
                            "gap": 10,
                        },
                    },
                }
            )
            add_text(f"panel{j}", row, 15, "Plus Jakarta Sans", text_fill)

        add_text(
            "screen",
            "Navigasi bawah: Ringkasan · Pesanan · Menu · Lainnya"
            if w == 390
            else "Token: Charcoal #20201E (60%) · Warm Off-White #F1EEE8 (30%) · Terracotta #A6533F (10%)",
            13,
            "Plus Jakarta Sans",
            "#C5BFB2",
        )

        refs = {}
        for step in steps:
            if "as" in step:
                refs[step["as"]] = next_id
            parent = step["params"].get("parent")
            if isinstance(parent, dict):
                step["params"]["parent"] = refs[parent["$ref"]]
            next_id += 1

        chunk = root / f"{i}-{w}.json"
        chunk.write_text(json.dumps(steps, ensure_ascii=False), encoding="utf-8")
        subprocess.run(["py", checker, str(chunk)], check=True, stdout=subprocess.DEVNULL)
        cmd = ["figcraft-cli.cmd", "run", str(chunk), "--out", str(target)]
        if target.exists():
            cmd += ["--in", str(target)]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)

print(target)
