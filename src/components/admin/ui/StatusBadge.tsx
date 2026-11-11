import type { ReactNode } from "react";

export type StatusTone = "attention" | "active" | "done" | "muted" | "error";

const TONES: Record<StatusTone, string> = {
  // Perlu ditangani sekarang
  attention: "border-terracotta bg-terracotta text-offwhite-pure",
  // Sedang berjalan
  active: "border-terracotta-light text-terracotta-light",
  // Selesai / siap
  done: "border-offwhite bg-offwhite text-charcoal",
  // Netral / nonaktif
  muted: "border-offwhite/20 text-offwhite-darker",
  // Gagal / perlu perbaikan
  error: "border-terracotta-light bg-terracotta/15 text-terracotta-light",
};

/** Status tanpa warna ke-4: dibedakan oleh ikon, kata, isian, dan kontras. */
export default function StatusBadge({
  tone,
  icon,
  children,
}: {
  tone: StatusTone;
  icon?: ReactNode;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${TONES[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}
