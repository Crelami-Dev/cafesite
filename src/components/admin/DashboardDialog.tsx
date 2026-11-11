"use client";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { CloseIcon } from "@/components/ui/icons";

/**
 * Dialog dashboard: bottom-sheet di mobile (menempel ke bawah, sudut atas membulat),
 * modal di tengah pada layar ≥ sm. Escape/tombol tutup memanggil onClose.
 */
export default function DashboardDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}): React.JSX.Element {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="dashboard-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        close.current();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close.current();
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-2xl border border-offwhite/10 bg-charcoal p-0 text-offwhite shadow-floating backdrop:bg-charcoal-darkest/80 sm:inset-0 sm:m-auto sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-lg"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-offwhite/10 bg-charcoal px-5 py-3 sm:px-8 sm:py-4">
        <h2 id="dashboard-dialog-title" className="font-serif text-xl sm:text-2xl">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="inline-flex size-11 items-center justify-center rounded-md text-offwhite-muted transition hover:bg-charcoal-light hover:text-offwhite"
        >
          <CloseIcon className="size-5" />
        </button>
      </header>
      <div className="p-5 sm:p-8">{children}</div>
    </dialog>
  );
}
