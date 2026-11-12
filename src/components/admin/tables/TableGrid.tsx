import type { AdminTable } from "@/types";
import TableCard from "./TableCard";

interface TableGridProps {
  tables: AdminTable[];
  onAdd: () => void;
  onQr: (table: AdminTable) => void;
  onEdit: (table: AdminTable) => void;
  onClean: (table: AdminTable) => void;
  onDelete: (table: AdminTable) => void;
  /** Id meja yang sedang diproses; tombolnya dikunci. */
  pendingIds?: ReadonlySet<string>;
}

export default function TableGrid(props: TableGridProps): React.JSX.Element {
  return (
    <section className="rounded-xl border border-charcoal-border bg-charcoal p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl">Meja di lantai ini</h2>
          <p className="mt-1 text-xs text-offwhite-darker">Status meja terbaca sekilas oleh tim kedai.</p>
        </div>
        <button type="button" className="inline-flex min-h-11 items-center rounded-xl border border-charcoal-border px-4 text-sm transition hover:border-offwhite" onClick={props.onAdd}>
          Tambah meja
        </button>
      </div>

      {props.tables.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-charcoal-border p-7 text-center">
          <p className="text-sm text-offwhite-muted">Belum ada meja di lantai ini.</p>
          <button type="button" className="mt-3 min-h-11 text-sm font-semibold text-offwhite-muted hover:text-offwhite" onClick={props.onAdd}>
            Tambahkan meja pertama
          </button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {props.tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onQr={() => props.onQr(table)}
              onEdit={() => props.onEdit(table)}
              onClean={() => props.onClean(table)}
              onDelete={() => props.onDelete(table)}
              pending={Boolean(props.pendingIds?.has(table.id))}
            />
          ))}
        </div>
      )}
    </section>
  );
}
