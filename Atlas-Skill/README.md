# Atlas-Skill

Suite skill frontend modular berbasis `SKILL.md` murni untuk membangun halaman web yang berkarakter kuat, ringan kodenya, teranimasi halus dengan `anime.js` v4, bebas pola AI slop maupun wireframe datar, dan wajib lulus audit visual + DOM di browser nyata.

---

## Struktur Folder

```text
Atlas-Skill/
├── plugin.json
├── README.md
├── demo-landing/
│   ├── vendor/anime.esm.min.js     # Bundle lokal anime.js v4 untuk demo HTML offline-ready
│   └── index.html                  # Proof landing page non-cafe KawalHook
└── skills/
    ├── atlas-plan/SKILL.md         # 1. Blueprint 7 poin: domain, 60-30-10 + WCAG AA, radius, tipografi & anime.js
    ├── atlas-anti-slop/SKILL.md    # 2. Anti-slop & anti-wireframe + standar motion anime.js v4
    ├── atlas-lean-code/SKILL.md    # 3. CSS native dulu, server-first, pola bersih releaseStyle anime.js
    └── atlas-checker/
        ├── SKILL.md                # 4. Audit 5 lapis + inspeksi screenshot 1:1 per fold
        └── scripts/
            └── quick-check.mjs     # Audit otomatis 5 viewport + contrast + stuck-opacity + smoke clicks
```

---

## Cara Pasang (Pilih Salah Satu)

### Opsi 1 — Tautkan via `.agents/skills.json` (Paling Rapi per Proyek)

```json
{
  "entries": [
    {
      "path": "../Atlas-Skill/skills"
    }
  ]
}
```

### Opsi 2 — Salin ke Project Baru

Salin ke-4 folder di dalam `Atlas-Skill/skills/` langsung ke `.agents/skills/` di project target.

### Opsi 3 — Pasang Global untuk Semua Project

- **Windows:** `%USERPROFILE%\.gemini\config\skills\`
- **macOS / Linux:** `~/.gemini/config/skills/`

Atau salin folder `Atlas-Skill/` ke `%USERPROFILE%\.gemini\config\plugins\atlas-skill\` karena `plugin.json` sudah tersedia.

---

## Cara Kerja & Standar Animasi (`anime.js` v4)

1. **`atlas-plan`:** Mengunci identitas domain, rasio warna **60-30-10** dengan kontras minimum WCAG AA (`4.5:1`), keluarga corner radius tunggal, *centerpiece* interaktif, serta rencana gerak `anime.js` sebelum kode ditulis.
2. **`atlas-anti-slop`:** Menolak grid 3-card kembar berulang, wireframe datar, dan copywriting klise; mewajibkan kedalaman visual nyata serta gerakan `anime.js` v4 (hero entrance stagger, scroll reveal aman tanpa stuck `opacity: 0`, SVG signal draw, & feedback state).
3. **`atlas-lean-code`:** Layout memakai CSS `grid`/`flex`/`clamp()`, sementara timeline/stagger/SVG choreography memakai `anime.js` (`import { animate, stagger, svg } from "animejs"` di Next.js `"use client"`, atau bundle ESM lokal untuk static HTML) lengkap dengan helper `releaseStyle` dan `prefers-reduced-motion`.
4. **`atlas-checker`:** Menjalankan build + `quick-check.mjs` across `320px–1440px`, mengecek **overflow, broken image/console errors, contrast WCAG, elemen macet `opacity: 0` pasca-scroll, overlap sibling, tap target mobile, smoke test klik tab/drawer**, lalu membaca langsung screenshot **1:1 per fold** (`top`, `mid`, `low`) sebelum mengakhiri task.

---

## Menjalankan `quick-check.mjs`

```bash
# Audit halaman statis + tangkap screenshot per fold ke folder sementara
node Atlas-Skill/skills/atlas-checker/scripts/quick-check.mjs Atlas-Skill/demo-landing/index.html --shots ./tmp-shots

# Audit server dev/preview Next.js atau Vite
node Atlas-Skill/skills/atlas-checker/scripts/quick-check.mjs http://127.0.0.1:3000 --shots ./tmp-shots
```

Tambahkan `--no-click-test` bila menjalankan audit pada halaman yang tombolnya memicu navigasi keluar. Hapus folder `./tmp-shots` setelah verifikasi selesai.
