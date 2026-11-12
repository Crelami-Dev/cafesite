# Atlas-Skill

Suite skill frontend modular berbasis `SKILL.md` murni untuk menghasilkan website yang terasa autentik sesuai domainnya, ringan kodenya, bebas pola template "AI slop", dan selalu lolos verifikasi visual di browser nyata sebelum selesai.

Berbeda dari paket template besar yang mengunci satu tampilan atau menyisipkan puluhan file kit ke repo proyek, **Atlas-Skill** hanya membawa **4 `SKILL.md` fokus + 1 script verifier ringkas (`quick-check.mjs`)** tanpa mengotori repository proyek target.

---

## Struktur Folder

```text
Atlas-Skill/
├── plugin.json
├── README.md
├── demo-landing/
│   └── index.html                  # Proof landing page non-cafe (dibangun murni pakai Atlas-Skill)
└── skills/
    ├── atlas-plan/SKILL.md         # 1. Pre-flight plan: identitas tema, 60-30-10, radius, ritme & layout 320-1440px
    ├── atlas-anti-slop/SKILL.md    # 2. Penjaga estetika: cegah card kembar, ornament palsu, & copy generik
    ├── atlas-lean-code/SKILL.md    # 3. Penjaga kode: CSS native dulu, 0 dependency sampah, semantic & cepat
    └── atlas-checker/
        ├── SKILL.md                # 4. Verifier loop: build -> quick-check -> buka screenshot -> fix
        └── scripts/
            └── quick-check.mjs     # Audit otomatis 5 viewport (320/360/390/820/1440) + screenshot PNG
```

---

## Cara Pasang (Pilih Salah Satu)

### Opsi 1 — Tautkan langsung via `.agents/skills.json` (Paling Rapi per Proyek)

Buat atau tambahkan ke file `.agents/skills.json` di root project target:

```json
{
  "entries": [
    {
      "path": "../Atlas-Skill/skills"
    }
  ]
}
```

> Sesuaikan path relatif dari folder `.agents/` menuju folder `Atlas-Skill/skills` (atau pakai path absolut jika `Atlas-Skill` disimpan di lokasi terpisah seperti `D:/skills/Atlas-Skill/skills`).

### Opsi 2 — Salin ke Project (Portable ke Repo Baru)

Salin ke-4 folder di dalam `Atlas-Skill/skills/` langsung ke `.agents/skills/` pada project target:

```text
your-project/
└── .agents/
    └── skills/
        ├── atlas-plan/
        ├── atlas-anti-slop/
        ├── atlas-lean-code/
        └── atlas-checker/
```

### Opsi 3 — Pasang Global untuk Semua Project

Salin ke-4 folder dari `Atlas-Skill/skills/` ke direktori konfigurasi global agent:

- **Windows:** `%USERPROFILE%\.gemini\config\skills\`
- **macOS / Linux:** `~/.gemini/config/skills/`

Atau salin seluruh folder `Atlas-Skill/` ke `%USERPROFILE%\.gemini\config\plugins\atlas-skill\` dan aktifkan lewat `.gemini/config/plugins.json` karena `plugin.json` sudah tersedia.

---

## Cara Kerja (Urutan Eksekusi 4 Langkah)

Saat meminta AI mengerjakan halaman atau komponen frontend baru, pastikan keempat skill berjalan berurutan:

1. **`atlas-plan` (Merancang sebelum menulis kode)**
   Menghasilkan rencana singkat 5 poin: identitas domain/tema, sistem warna **60-30-10**, satu keluarga corner radius yang konsisten, peta ritme antar section agar tidak mengulang struktur, serta blueprint responsif dari **320px hingga 1440px** tanpa scope creep.
2. **`atlas-anti-slop` (Menjaga keaslian desain & copy)**
   Melarang pola AI slop yang paling sering muncul: deretan 3 card sejajar kembar berulang, barisan metrik/badge kosong, gradient ungu-biru tanpa konteks, tombol CTA sejajar yang patah canggung di HP 320–390px, serta copywriting klise (*"solusi komprehensif"*, *"era digital"*, *"game-changing"*).
3. **`atlas-lean-code` (Menulis kode ringkas & native-first)**
   Mengutamakan fitur native HTML/CSS (`grid`, `flexbox`, `clamp()`, `aspect-ratio`, `<details>`) sebelum membuat state JS atau menginstal library baru. Semua foto pakai format optimal (`.webp`/`.avif`) dengan ukuran proporsional & lazy-load di bawah fold.
4. **`atlas-checker` (Audit browser + inspeksi mata langsung)**
   Menjalankan build/preview, mengeksekusi `quick-check.mjs`, **membaca langsung file screenshot PNG hasil capture** untuk menemukan cacat visual yang tidak tertangkap oleh test unit (teks kepotong, jarak janggal, kontras lemah, tombol ter-wrap aneh), memperbaiki semuanya, lalu mengulang cek hingga bersih.

---

## Menjalankan `quick-check.mjs` Secara Langsung

Script checker dapat mengaudit baik server lokal (`http://localhost:3000`) maupun file/folder HTML statis (otomatis menyalakan static server internal di port acak):

```bash
# Audit file HTML statis + simpan screenshot ke folder sementara
node Atlas-Skill/skills/atlas-checker/scripts/quick-check.mjs Atlas-Skill/demo-landing/index.html --shots ./tmp-shots

# Audit dev/preview server Next.js / Vite
node Atlas-Skill/skills/atlas-checker/scripts/quick-check.mjs http://127.0.0.1:3000 --shots ./tmp-shots
```

> **Prasyarat:** Node.js + `playwright` (terpasang di project atau global) beserta browser Chromium / Chrome / Edge. Hapus folder `./tmp-shots` setelah verifikasi visual selesai.

