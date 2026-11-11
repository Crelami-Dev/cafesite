"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RagIngestJob } from "@/types";
import { adminButtonClass, adminError, adminRequest, adminSecondaryClass } from "./admin-api";
import WaConnectionPanel from "./WaConnectionPanel";

const MAX_BYTES = 10 * 1024 * 1024;
const statuses: Record<RagIngestJob["status"], string> = { pending: "◷ Menunggu", processing: "↻ Diproses", done: "✓ Selesai", failed: "! Gagal" };

function formatSize(bytes: number): string {
  return bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function WaBotManager(): React.JSX.Element {
  const [jobs, setJobs] = useState<RagIngestJob[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const loadJobs = useCallback(async (): Promise<void> => {
    try {
      setJobs((await adminRequest<{ data: RagIngestJob[] }>("wabot")).data);
      setListError("");
    } catch (cause: unknown) { setListError(adminError(cause)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll(): Promise<void> {
      await loadJobs();
      if (!cancelled) timer = setTimeout(() => void poll(), 4000);
    }
    void poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [loadJobs]);

  async function upload(file: File): Promise<void> {
    setBusy(true); setError(""); setMessage("");
    try {
      const name = file.name.toLowerCase();
      if (!name.endsWith(".pdf") && !name.endsWith(".md")) throw new Error("Pilih file PDF (.pdf) atau Markdown (.md).");
      if (file.size === 0) throw new Error("File kosong.");
      if (file.size > MAX_BYTES) throw new Error("Ukuran file maksimal 10 MB.");
      const form = new FormData();
      form.append("file", file);
      await adminRequest("wabot", { method: "POST", body: form });
      setMessage(`${file.name} diterima dan sedang dipelajari asisten…`);
      await loadJobs();
    } catch (cause: unknown) { setError(adminError(cause)); }
    finally { setBusy(false); }
  }

  async function act(method: "PATCH" | "DELETE", job: RagIngestJob): Promise<void> {
    if (method === "DELETE" && !window.confirm(`Hapus ${job.source} beserta seluruh pengetahuan dari dokumen ini?`)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await adminRequest("wabot", { method, body: JSON.stringify({ id: job.id, source: job.source }) });
      setMessage(method === "DELETE" ? "Dokumen dan pengetahuannya sudah dihapus." : "Dokumen masuk antrean untuk diproses ulang.");
      await loadJobs();
    } catch (cause: unknown) { setError(adminError(cause)); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-w-0 space-y-6">
      <WaConnectionPanel />

      <section aria-labelledby="wa-knowledge-title" className="rounded-xl border border-charcoal-border bg-charcoal p-5 md:p-6">
        <h2 id="wa-knowledge-title" className="font-serif text-2xl">Pengetahuan asisten</h2>
        <p className="mt-2 text-sm leading-6 text-offwhite-muted">
          Menu dan harga dibaca otomatis dari data kedai. Tambahkan dokumen (PDF atau Markdown) untuk hal lain: fasilitas, aturan, promo, cerita kedai. Unggah ulang nama yang sama untuk mengganti isinya.
        </p>
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file && !busy) void upload(file); }}
          className={`mt-5 grid place-items-center rounded-xl border border-dashed p-6 text-center transition ${dragging ? "border-terracotta bg-charcoal-light" : "border-charcoal-border"}`}
        >
          <p className="text-sm text-offwhite-muted">Seret file ke sini, atau</p>
          <button type="button" disabled={busy} className={`${adminButtonClass} mt-3`} onClick={() => input.current?.click()}>{busy ? "Memproses…" : "Pilih file"}</button>
          <p className="mt-3 text-xs text-offwhite-darker">.pdf atau .md · maksimal 10 MB · harus berisi teks (bukan hasil scan gambar)</p>
          <input ref={input} id="rag-file" type="file" hidden accept=".pdf,.md,application/pdf,text/markdown,text/plain" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void upload(file); }} />
        </div>
        {message && <p role="status" className="mt-3 text-sm text-offwhite-muted">{message}</p>}
        {(error || listError) && <p role="alert" className="mt-3 break-words text-sm text-terracotta-light">{error || listError}</p>}
      </section>

      <section aria-label="Status dokumen" className="min-w-0 overflow-x-auto rounded-xl border border-charcoal-border">
        <table className="w-full text-left text-sm">
          <caption className="p-4 text-left text-offwhite-muted">Status dokumen diperbarui otomatis.</caption>
          <thead className="bg-charcoal text-offwhite-muted"><tr><th scope="col" className="p-4">File</th><th scope="col" className="p-4">Status</th><th scope="col" className="p-4">Tindakan</th></tr></thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-t border-charcoal-border align-top">
                <td className="max-w-48 break-words p-4">
                  <p className="font-medium text-offwhite">{job.source}</p>
                  <p className="mt-1 text-xs text-offwhite-darker tabular-nums">{formatSize(job.size)}{job.status === "done" ? ` · ${job.chunks} potongan` : ""}</p>
                  <time dateTime={job.updated_at} className="mt-1 block text-xs text-offwhite-darker tabular-nums">{new Date(job.updated_at).toLocaleString("id-ID")}</time>
                </td>
                <td className="max-w-64 p-4">
                  <span className={`inline-block rounded-lg bg-charcoal-light px-2 py-1 ${job.status === "failed" ? "text-terracotta-light" : "text-offwhite-muted"}`}>{statuses[job.status]}</span>
                  {job.status === "failed" && job.error && <p className="mt-2 break-words text-xs text-terracotta-light">{job.error}</p>}
                  {job.status === "done" && job.note && <p className="mt-2 break-words text-xs text-offwhite-darker">{job.note}</p>}
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {(job.status === "done" || job.status === "failed") && <button disabled={busy} className={adminSecondaryClass} onClick={() => void act("PATCH", job)}>Proses ulang</button>}
                    <button disabled={busy} className={adminSecondaryClass} onClick={() => void act("DELETE", job)}>Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!jobs.length && <p className="p-4 text-sm text-offwhite-muted">{loading ? "Memuat dokumen…" : "Belum ada dokumen. Menu tetap bisa dijawab bot tanpa dokumen."}</p>}
      </section>
    </div>
  );
}
