import type { AdminNoticeProps } from "@/types";

export default function AdminNotice({ message, error = false }: AdminNoticeProps): React.JSX.Element | null {
  if (!message) return null;
  return <p role={error ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${error ? "border-terracotta-light/40 bg-terracotta/10 text-offwhite" : "border-offwhite/25 bg-offwhite/5 text-offwhite"}`}>{message}</p>;
}
