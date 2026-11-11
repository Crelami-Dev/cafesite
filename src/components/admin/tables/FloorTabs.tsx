import type { AdminFloor } from "@/types";
import { adminSecondaryClass } from "../admin-api";

interface FloorTabsProps {
  floors: AdminFloor[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (floor: AdminFloor) => void;
  onDelete: (floor: AdminFloor) => void;
}

export default function FloorTabs({ floors, activeId, onSelect, onAdd, onEdit, onDelete }: FloorTabsProps): React.JSX.Element {
  const active = floors.find((floor) => floor.id === activeId);
  return (
    <div className="min-w-0 rounded-xl border border-charcoal-border bg-charcoal p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto" role="tablist" aria-label="Pilih lantai">
          {floors.map((floor) => (
            <button
              key={floor.id}
              role="tab"
              aria-selected={floor.id === activeId}
              className={`min-h-11 shrink-0 rounded-xl border px-4 text-sm transition ${floor.id === activeId ? "border-offwhite bg-charcoal-light text-offwhite" : "border-charcoal-border text-offwhite-muted hover:border-offwhite"}`}
              onClick={() => onSelect(floor.id)}
            >
              {floor.name}
            </button>
          ))}
        </div>
        <button type="button" className={`${adminSecondaryClass} shrink-0`} onClick={onAdd}>Tambah lantai</button>
      </div>
      {active && (
        <div className="mt-3 flex gap-4 border-t border-charcoal-border/60 pt-3">
          <button type="button" className="min-h-11 text-xs text-offwhite-muted transition hover:text-offwhite" onClick={() => onEdit(active)}>Ubah nama</button>
          <button type="button" className="min-h-11 text-xs text-terracotta-light transition hover:text-offwhite" onClick={() => onDelete(active)}>Hapus lantai</button>
        </div>
      )}
    </div>
  );
}
