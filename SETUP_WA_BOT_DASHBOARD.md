> **ARSIP.** Dokumen ini menggambarkan versi lama (Supabase). Bot sekarang memakai SQLite dan ditautkan lewat dashboard; panduan terkini: `docs/WHATSAPP_BOT_OPENWA_REPORT.md`.

# WhatsApp Bot: upload PDF dari dashboard

1. Jalankan `supabase/06_wa_bot_dashboard.sql` di Supabase SQL Editor setelah `01_schema.sql` dan `04_rag_documents.sql`. Migrasi idempotent; embedding tetap `halfvec(2048)`. CLI ingest juga kini membutuhkan migrasi 06.
2. Deploy website. Admin melihat **Operasional > WhatsApp Bot**. Staff hanya bisa melihat/mengaksesnya jika `staff_modules.wa_bot.enabled=true` (default false). Jika UI akses tim belum menyediakan toggle, admin dapat mengatur lewat endpoint existing `PUT /api/admin/manage?resource=modules`, body `{"id":"wa_bot","enabled":true}`, dengan bearer token admin.
3. Di `server/`, gunakan environment bot yang sudah ada: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `EMBEDDING_API_KEY`, `EMBEDDING_MODEL=nvidia/nemotron-3-embed-1b`, `EMBEDDING_BASE_URL`, dan `WA_BOT_PHONE` (dibutuhkan loader existing). Tidak ada credential embedding baru di website.
4. Jalankan satu proses `npm run rag:watch` dari `server/`, selain proses bot WhatsApp. Interval opsional `RAG_POLL_MS=15000`, minimum 1000 ms. SIGINT/SIGTERM menyelesaikan job aktif sebelum keluar.

Browser mengunggah PDF maksimal 10 MiB ke bucket publik `wa-bot-rag`; API memeriksa permission, path, MIME, ukuran, dan header `%PDF-` sebelum antrean dibuat. Parser tetap hanya berjalan di bot. Jangan unggah informasi rahasia ke bucket publik. PDF scan tanpa teks memerlukan OCR di luar modul ini.

Nama dinormalisasi lowercase, spasi menjadi tanda hubung; nama sama berarti sumber sama. Setiap upload punya path timestamp + UUID tanpa overwrite. Riwayat percobaan tetap terlihat. Antrean berjalan menurut created_at/id; proses ulang masuk ke belakang antrean dan bisa mengaktifkan kembali isi versi lama yang dipilih.

Klaim memakai RPC `UPDATE RETURNING` dalam transaksi dengan advisory transaction lock. Hanya satu job processing global, bahkan jika proses worker kedua tidak sengaja dijalankan. Chunk+embed memakai pipeline bersama CLI/worker. Setelah semua embedding sukses, RPC mengganti chunk secara atomik dan menandai done. Error insert tidak menghilangkan chunk lama. Penghapusan source membatalkan semua job; commit worker memeriksa kepemilikan job sehingga tidak menghidupkan kembali dokumen yang dihapus. Download Storage dicoba maksimal dua kali.

## Pemulihan

Tidak ada pengambilalihan otomatis job processing: ini menghindari dua proses menulis hasil bersamaan saat embedding lambat. Jika worker mati paksa atau gagal memperbarui status, **hentikan semua worker terlebih dahulu**, lalu jalankan SQL berikut dan hidupkan satu worker kembali:

```sql
update public.rag_ingest_jobs
set status='failed', error='Worker terhenti. Silakan proses ulang.',
    processing_by=null, started_at=null, updated_at=now()
where status='processing';
```

Klik **Proses ulang** pada job tersebut. Kesalahan rinci ada di log worker; dashboard tidak memaparkan body respons provider atau credential. Bila upload berhasil tetapi pendaftaran job gagal, tombol **Coba daftarkan PDF kembali** mengirim path yang sama secara idempotent. Jika tab ditutup saat itu, file tanpa job dapat dibersihkan dari Storage oleh operator.

## Verifikasi penerimaan pada deployment

- Upload menu-info.pdf; pending → processing → done; tanya menu lewat WhatsApp dan cocokkan isi PDF.
- Upload nama sama dengan isi berbeda; jawaban retrieval harus memakai versi baru setelah done.
- Hapus saat done maupun processing; semua attempt dan chunk source hilang, worker tidak menulis ulang.
- File non-PDF, header palsu, atau >10 MiB ditolak tanpa job.
- Staff tanpa wa_bot tidak melihat nav; GET/POST/PATCH/DELETE ditolak 403.
- Uji dua worker, kegagalan embedding/download, retry, dan prosedur pemulihan di atas.
- `npm run build` di root dan server; `node --test tests/rag-pipeline.test.cjs` dari server setelah build.

Build dan tes lokal tidak membuktikan RLS/SQL/Storage/NVIDIA/WhatsApp pada deployment. Uji integrasi di atas membutuhkan migrasi aktif, worker, serta sesi WhatsApp terhubung.
