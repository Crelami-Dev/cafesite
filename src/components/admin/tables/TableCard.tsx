import Link from "next/link";
import type { AdminTable } from "@/types";
import { formatRupiah } from "../orders/order-format";

interface TableCardProps {
  table: AdminTable;
  onQr: () => void;
  onEdit: () => void;
  onClean: () => void;
  onDelete: () => void;
  pending?: boolean;
}

const statusText: Record<AdminTable["status"], string> = {
  available: "✓ Tersedia",
  occupied: "● Terisi",
  dirty: "↻ Perlu dibersihkan",
};
const statusClass: Record<AdminTable["status"], string> = {
  available: "border-offwhite/30 bg-offwhite/10 text-offwhite",
  occupied: "border-terracotta-light/40 bg-terracotta/15 text-offwhite",
  dirty: "border-terracotta/60 bg-terracotta/20 text-terracotta-light",
};

export default function TableCard({ table, onQr, onEdit, onClean, onDelete, pending = false }: TableCardProps): React.JSX.Element {
  return (
    <article className="flex flex-col rounded-xl border border-charcoal-border bg-charcoal p-4 transition hover:border-charcoal-muted">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-xl text-offwhite">{table.label}</h3>
          <p className="mt-1 truncate text-xs text-offwhite-darker">ID {table.id}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClass[table.status]}`}>
          {statusText[table.status]}
        </span>
      </div>

      {(table.active_orders ?? (table.active_order ? [table.active_order] : [])).length > 0 && <p className="mt-3 text-xs text-offwhite-muted">{(table.active_orders ?? [table.active_order]).length} pesanan aktif · tagihan terpisah</p>}
      {(table.active_orders ?? (table.active_order ? [table.active_order] : [])).map(order => (
        <Link
          key={order.id}
          href={`/dashboard/orders?order=${encodeURIComponent(order.id)}`}
          className="mt-3 block rounded-lg border border-offwhite/15 bg-charcoal-light/50 p-2.5 text-xs transition hover:border-offwhite"
        >
          <p className="truncate font-semibold text-offwhite">
            #{order.queue_number} · {order.customer_name}
          </p>
          <p className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-offwhite-muted tabular-nums">
            <span>{formatRupiah(order.total)}</span>
            <span className="text-terracotta-light">Lihat pesanan →</span>
          </p>
        </Link>
      ))}

      <button type="button" className="mt-4 min-h-11 rounded-xl bg-terracotta px-3 text-xs font-semibold transition hover:bg-terracotta-hover" onClick={onQr}>
        Lihat QR
      </button>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" className="min-h-11 rounded-xl border border-charcoal-border px-2 text-xs transition hover:border-offwhite" onClick={onEdit}>
          Edit
        </button>
        {table.status === "dirty" ? (
          <button type="button" disabled={pending} aria-busy={pending} className="min-h-11 rounded-xl border border-offwhite/40 px-2 text-xs text-offwhite transition hover:bg-charcoal-light disabled:opacity-50" onClick={onClean}>
            {pending ? "Memproses…" : "Bersihkan"}
          </button>
        ) : (
          <button type="button" className="min-h-11 rounded-xl px-2 text-xs text-terracotta-light transition hover:bg-terracotta/10" onClick={onDelete}>
            Hapus
          </button>
        )}
      </div>
      {table.status === "dirty" && (
        <button type="button" className="mt-2 min-h-11 text-xs text-terracotta-light transition hover:text-offwhite" onClick={onDelete}>
          Hapus meja
        </button>
      )}
    </article>
  );
}
