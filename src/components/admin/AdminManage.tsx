"use client";

import { useEffect, useState } from "react";
import { adminButtonClass, adminError, adminRequest } from "./admin-api";
import type { AdminModule } from "@/types";

const editableModules: AdminModule[] = ["cafe", "gallery", "testimonials", "faq", "location"];

const moduleCopy: Partial<Record<AdminModule, { title: string; note: string }>> = {
  orders: { title: "Pesanan masuk", note: "Pesan yang dibuat pengunjung lewat halaman pesanan akan tersaji di sini." },
  tables: { title: "Meja & QR", note: "Denah meja dan kode QR yang dipasang di tiap meja." },
  reports: { title: "Laporan", note: "Ringkasan penjualan akan tersedia setelah ada pesanan yang selesai." },
  cafe: { title: "Info kafe", note: "Nama, sapaan, kontak, dan alamat yang tampil di website." },
  gallery: { title: "Galeri", note: "Kumpulan foto yang memperlihatkan suasana kedai." },
  testimonials: { title: "Testimoni", note: "Cerita dari pengunjung yang singgah." },
  faq: { title: "Pertanyaan umum", note: "Jawaban yang memudahkan kunjungan pertama." },
  location: { title: "Panduan lokasi", note: "Petunjuk arah dan titik yang membantu mereka datang." },
};

export default function AdminManage({ module }: { module: AdminModule }): React.JSX.Element {
  const [data, setData] = useState<unknown>(null);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const meta = moduleCopy[module];
  const isEditable = editableModules.includes(module);
  const recordCount = Array.isArray(data) ? data.length : null;

  useEffect(() => {
    let cancelled = false;
    void adminRequest<{ data: unknown }>(`manage?resource=${module}`)
      .then((result) => {
        if (cancelled) return;
        setData(result.data);
        setDraft(JSON.stringify(result.data ?? (isEditable ? [] : {}), null, 2));
        setMessage("");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setMessage(adminError(cause));
      });
    return () => { cancelled = true; };
  }, [module, isEditable]);

  async function save(): Promise<void> {
    setBusy(true);
    try {
      const parsed: unknown = JSON.parse(draft);
      await adminRequest(`manage?resource=${module}`, { method: "PUT", body: JSON.stringify({ data: parsed }) });
      setMessage("Tersimpan dan langsung dipublikasikan.");
    } catch (cause: unknown) {
      setMessage(cause instanceof SyntaxError ? "Format data belum valid." : adminError(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-charcoal-border bg-charcoal p-5 md:p-6">
      <header>
        <h2 className="font-serif text-2xl">{meta?.title ?? module}</h2>
        <p className="mt-1.5 max-w-xl text-sm leading-6 text-offwhite-darker">{meta?.note}</p>
      </header>

      {isEditable ? (
        <div className="mt-5">
          <label htmlFor={`${module}-json`} className="sr-only">Data modul {module}</label>
          <textarea
            id={`${module}-json`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-72 w-full rounded-xl border border-charcoal-border bg-charcoal-darkest p-4 font-mono text-xs leading-6 text-offwhite outline-none transition focus:border-offwhite"
          />
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => void save()} disabled={busy} className={adminButtonClass}>
              {busy ? "Menyimpan…" : "Simpan perubahan"}
            </button>
            {message && <p className="text-sm text-offwhite-muted">{message}</p>}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-charcoal-border bg-charcoal-darkest p-5">
          {recordCount === null ? (
            <p className="text-sm leading-6 text-offwhite-muted">{meta?.note}</p>
          ) : recordCount === 0 ? (
            <p className="text-sm leading-6 text-offwhite-muted">
              Belum ada data untuk modul ini. {module === "reports" && "Coba cek lagi setelah pesanan selesai."}
            </p>
          ) : (
            <p className="text-sm leading-6 text-offwhite-muted">
              Ada <span className="font-semibold text-offwhite">{recordCount}</span> catatan aktif. Detail tampil
              langsung di website.
            </p>
          )}
        </div>
      )}
    </section>
  );
}