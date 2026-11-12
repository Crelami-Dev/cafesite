# Deploy Bot WhatsApp CafeSite (VPS Ubuntu + PM2)

Bot (`server/`) dan website Next.js berbagi **satu file SQLite**, jadi keduanya harus berjalan di mesin yang sama. Penjelasan lengkap, arsitektur, dan hasil uji: [`docs/WHATSAPP_BOT_OPENWA_REPORT.md`](../docs/WHATSAPP_BOT_OPENWA_REPORT.md).

## 1. Persiapan

```bash
sudo apt update && sudo apt install -y git curl chromium-browser   # atau: chromium / google-chrome
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs   # Node 22.5+ wajib (node:sqlite)
sudo npm install -g pm2
```

`zstd` **tidak perlu** dipasang (bot menanganinya sendiri). Cek path browser: `which chromium-browser` atau `which google-chrome`.

## 2. Pasang dan bangun

```bash
git clone <url-repo> cafesite && cd cafesite
npm ci && npm run build          # website
cd server && npm ci && npm run build
```

## 3. Konfigurasi

```bash
# server/.env.local
cp .env.example .env.local && nano .env.local
```

Isi minimal: `BOT_CONTROL_TOKEN` (acak, ≥16 karakter), `PUPPETEER_EXECUTABLE_PATH`, dan `DB_PATH` bila bukan `../.data/cafesite.dev.db`. Opsional: `NVIDIA_*`, `EMBEDDING_*`.

Di `.env.local` **root** (Next.js): `CONTENT_SOURCE=sqlite`, `WA_BOT_CONTROL_URL=http://127.0.0.1:8787`, dan `WA_BOT_CONTROL_TOKEN` yang **sama persis** dengan `BOT_CONTROL_TOKEN`.

Jangan commit kedua file `.env.local`.

## 4. Jalankan

```bash
cd cafesite/server && pm2 start ecosystem.config.js
cd .. && pm2 start npm --name cafesite-web -- start
pm2 save && pm2 startup     # jalankan baris sudo yang dicetak
```

## 5. Tautkan WhatsApp

Buka `https://<domain>/dashboard` → **Operasional → WhatsApp Bot → Hubungkan WhatsApp**, pindai QR (WhatsApp → Perangkat tertaut). Tidak perlu `pm2 logs`. Setelah tersambung sekali, bot menyambung sendiri tiap restart/reboot.

Pindah mesin tanpa scan ulang: salin folder `server/session/` **dan** file `.data/cafesite.dev.db` saat bot berhenti. Folder `session/` setara akses penuh ke akun WhatsApp — jangan di-commit, jangan dibagikan.

## 6. Verifikasi

```bash
pm2 status                          # cafesite-wa-bot: online
pm2 logs cafesite-wa-bot --lines 30 # "Bot siap" dan "WhatsApp tersambung."
cd server && npm test               # 93 tes
```

Dari ponsel lain kirim `halo bot` ke nomor bot → harus dijawab perkenalan.

## 7. Update

```bash
git pull && npm ci && npm run build
cd server && npm ci && npm run build && pm2 restart cafesite-wa-bot
```

`SIGINT/SIGTERM` ditangani (`src/index.ts`): worker berhenti, sesi WhatsApp ditutup, database ditutup, lalu proses keluar.

Catatan pengembangan: `npm run dev` berjalan tanpa watch supaya sesi WhatsApp tidak terputus saat file diedit; pakai `npm run dev:watch` hanya bila sedang mengubah kode bot. Sesi dicadangkan otomatis (`session/*.bak`).

## Pemecahan masalah

| Gejala | Solusi |
|---|---|
| *Port 8787 sudah dipakai* | Ada bot lama: `pm2 delete cafesite-wa-bot` atau hentikan proses `tsx watch` di terminal |
| *browser is already running* setelah crash | `pkill -f chrom`, lalu `pm2 restart cafesite-wa-bot` |
| Dashboard *Token kontrol tidak cocok* | Samakan kedua token |
| Sering restart karena memori | Naikkan `max_memory_restart` di `ecosystem.config.js` (Chromium bisa >200 MB) |
| Perlu pasang ulang nomor | Dashboard → *Keluar & ganti nomor*, atau hentikan bot lalu kosongkan `server/session/` |

Percakapan: pelanggan mengetik `halo bot` untuk mengaktifkan, `tutup bot` untuk mengakhiri; sesi habis otomatis setelah 10 menit tanpa pesan. Satu instance bot saja per nomor.
