import { useState } from "react";
import Image from "next/image";
import type { AdminMenuRecord } from "@/types";
import { formatPrice } from "@/lib/utils";
import { ChevronDownIcon, EditIcon, ImageIcon, StarIcon, TrashIcon } from "@/components/ui/icons";
import Switch from "./ui/Switch";

interface MenuRowProps {
  record: AdminMenuRecord;
  index: number;
  total: number;
  isDragging?: boolean;
  isDragOver?: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onToggleAvailable: (available: boolean) => void;
  /** Sedang disimpan: semua aksi baris ini dinonaktifkan. */
  pending?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDragStart?: (e: React.DragEvent<HTMLElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLElement>) => void;
}

const iconButton =
  "inline-flex size-11 items-center justify-center rounded-md text-offwhite-muted transition hover:bg-charcoal-lighter hover:text-offwhite disabled:cursor-not-allowed disabled:opacity-30";

/** Satu baris menu: foto, nama, harga, saklar ketersediaan, dan aksi (urut, ubah, hapus). */
export default function MenuRow({
  record,
  index,
  total,
  isDragging,
  isDragOver,
  onEdit,
  onRemove,
  onToggleAvailable,
  pending = false,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: MenuRowProps): React.JSX.Element {
  const { data } = record;
  const available = record.is_available !== false;
  const [isShaking, setIsShaking] = useState(false);

  function handleHandleClick(): void {
    setIsShaking(false);
    requestAnimationFrame(() => {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    });
  }

  return (
    <li
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`grid gap-2 py-3 transition-all duration-150 md:grid-cols-[1fr_auto] md:items-center md:gap-4 ${
        isShaking ? "animate-shake-vertical bg-charcoal-lighter/40" : ""
      } ${isDragging ? "opacity-40" : ""} ${isDragOver ? "border-t-2 border-t-terracotta" : ""}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {data.image ? (
          <Image
            src={data.image}
            alt={`Foto ${data.name}`}
            width={56}
            height={56}
            unoptimized
            className={`size-14 shrink-0 rounded-lg border border-offwhite/10 object-cover ${available ? "" : "opacity-50"}`}
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-lg border border-offwhite/10 bg-charcoal-darkest text-offwhite-darker"
          >
            <ImageIcon className="size-5" />
          </div>
        )}
        <div className={`min-w-0 flex-1 ${available ? "" : "opacity-60"}`}>
          <p className="flex items-center gap-1.5 text-base font-semibold text-offwhite">
            <span className="truncate">{data.name}</span>
            {data.isFeatured && <StarIcon className="size-4 shrink-0 text-terracotta-light" />}
          </p>
          <p className="mt-0.5 text-sm font-medium tabular-nums text-offwhite-muted">{formatPrice(data.price)}</p>
          {data.description && (
            <p className="mt-0.5 hidden line-clamp-1 text-xs text-offwhite-darker md:block">{data.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-1 md:justify-end">
        <div className="flex items-center gap-1">
          <Switch
            checked={available}
            disabled={pending}
            onChange={onToggleAvailable}
            label={`${data.name}: ${available ? "tersedia" : "habis"}`}
          />
          <span className={`w-14 text-xs font-medium ${available ? "text-offwhite" : "text-terracotta-light"}`}>
            {available ? "Tersedia" : "Habis"}
          </span>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            draggable
            onClick={handleHandleClick}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            title="Tahan dan tarik untuk mengatur urutan"
            aria-label={`Tahan dan tarik untuk mengatur urutan ${data.name}`}
            className={`${iconButton} hidden cursor-grab active:cursor-grabbing lg:inline-flex`}
          >
            ⋮⋮
          </button>
          <button
            type="button"
            disabled={pending || index === 0}
            onClick={onMoveUp}
            aria-label={`Pindahkan ${data.name} ke atas`}
            className={iconButton}
          >
            <ChevronDownIcon className="size-4 rotate-180" />
          </button>
          <button
            type="button"
            disabled={pending || index === total - 1}
            onClick={onMoveDown}
            aria-label={`Pindahkan ${data.name} ke bawah`}
            className={iconButton}
          >
            <ChevronDownIcon className="size-4" />
          </button>
          <button type="button" disabled={pending} onClick={onEdit} aria-label={`Ubah ${data.name}`} className={iconButton}>
            <EditIcon className="size-4" />
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onRemove}
            aria-label={`Hapus ${data.name}`}
            className={`${iconButton} hover:!text-terracotta-light`}
          >
            <TrashIcon className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}
