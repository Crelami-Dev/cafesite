"use client";
import { useState } from "react";
import { TrashIcon, WarningIcon } from "@/components/ui/icons";
import { adminDangerClass, adminError, adminSecondaryClass } from "./admin-api";
import DashboardDialog from "./DashboardDialog";
import { useSingleFlight } from "./useSingleFlight";

/**
 * Konfirmasi hapus yang MENUNGGU hasilnya: tombol berubah jadi "Menghapus…", dialog tidak bisa ditutup
 * selama proses, dan baru tertutup setelah server benar-benar menghapus. Bila gagal, pesan tampil di sini
 * dan item tetap ada.
 */
export default function ConfirmDeleteDialog({
  title,
  message,
  confirmLabel = "Hapus",
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  /** Harus melempar error bila gagal; dialog ditutup (onClose) hanya bila berhasil. */
  onConfirm: () => Promise<void>;
  onClose: () => void;
}): React.JSX.Element {
  const { run, pending } = useSingleFlight();
  const [error, setError] = useState("");

  async function confirm(): Promise<void> {
    setError("");
    const done = await run(async () => {
      try {
        await onConfirm();
        return true;
      } catch (cause) {
        setError(adminError(cause));
        return false;
      }
    });
    if (done) onClose();
  }

  return (
    <DashboardDialog title={title} onClose={() => (pending ? undefined : onClose())}>
      <div className="grid gap-5">
        <p className="text-sm leading-relaxed text-offwhite-muted">{message}</p>
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-terracotta-light/40 bg-terracotta/10 p-3 text-sm text-terracotta-light">
            <WarningIcon className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}
        <div className="grid gap-2 sm:flex sm:justify-end">
          <button type="button" disabled={pending} onClick={onClose} className={adminSecondaryClass}>
            Batal
          </button>
          <button type="button" disabled={pending} aria-busy={pending} onClick={() => void confirm()} className={`${adminDangerClass} sm:min-w-36`}>
            {pending ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-terracotta-light/30 border-t-terracotta-light motion-reduce:animate-none" aria-hidden="true" />
                Menghapus…
              </>
            ) : (
              <>
                <TrashIcon className="size-4" />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardDialog>
  );
}
