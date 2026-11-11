"use client";

import { useState } from "react";
import type { AdminMenuRecord, MenuCategory } from "@/types";
import MenuRow from "./MenuRow";

interface MenuCategoryGroupProps {
  category: MenuCategory;
  name: string;
  description: string;
  records: AdminMenuRecord[];
  onEdit: (record: AdminMenuRecord) => void;
  onRemove: (record: AdminMenuRecord) => void;
  onToggleAvailable: (record: AdminMenuRecord, available: boolean) => void;
  onReorder: (records: AdminMenuRecord[]) => void;
}

export default function MenuCategoryGroup({
  name,
  description,
  records,
  onEdit,
  onRemove,
  onToggleAvailable,
  onReorder,
}: MenuCategoryGroupProps): React.JSX.Element {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  function handleMove(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= records.length || fromIndex === toIndex) return;
    const next = [...records];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onReorder(next);
  }

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const fromIndex = records.findIndex((r) => r.id === draggedId);
    const toIndex = records.findIndex((r) => r.id === targetId);
    if (fromIndex !== -1 && toIndex !== -1) {
      handleMove(fromIndex, toIndex);
    }
    setDraggedId(null);
    setDragOverId(null);
  }

  return (
    <section className="min-w-0 rounded-lg border border-offwhite/10 bg-charcoal-light px-4 pb-1 pt-4 sm:px-5">
      <header className="flex items-baseline justify-between gap-3 border-b border-offwhite/10 pb-3">
        <div className="min-w-0">
          <h3 className="font-serif text-lg text-offwhite sm:text-xl">{name}</h3>
          {description && <p className="mt-0.5 hidden truncate text-sm text-offwhite-muted sm:block">{description}</p>}
        </div>
        <span className="shrink-0 text-xs tabular-nums text-offwhite-darker">{records.length} menu</span>
      </header>

      <ul className="divide-y divide-offwhite/10">
        {records.map((record, index) => (
          <MenuRow
            key={record.id}
            record={record}
            index={index}
            total={records.length}
            isDragging={draggedId === record.id}
            isDragOver={dragOverId === record.id}
            onEdit={() => onEdit(record)}
            onRemove={() => onRemove(record)}
            onToggleAvailable={(value) => onToggleAvailable(record, value)}
            onMoveUp={() => handleMove(index, index - 1)}
            onMoveDown={() => handleMove(index, index + 1)}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", record.id);
              e.dataTransfer.effectAllowed = "move";
              setDraggedId(record.id);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragOverId !== record.id) {
                setDragOverId(record.id);
              }
            }}
            onDragLeave={() => {
              if (dragOverId === record.id) {
                setDragOverId(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(record.id);
            }}
            onDragEnd={() => {
              setDraggedId(null);
              setDragOverId(null);
            }}
          />
        ))}
      </ul>
    </section>
  );
}
