import { useState } from "react";
import Image from "next/image";
import type { AdminMenuRecord } from "@/types";
import { formatPrice } from "@/lib/utils";
import { ImageIcon } from "@/components/ui/icons";

interface MenuRowProps {
  record: AdminMenuRecord;
  index: number;
  total: number;
  isDragging?: boolean;
  isDragOver?: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDragStart?: (e: React.DragEvent<HTMLElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLElement>) => void;
}

export default function MenuRow({
  record,
  index,
  total,
  isDragging,
  isDragOver,
  onEdit,
  onRemove,
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
      setTimeout(() => {
        setIsShaking(false);
      }, 500);
    });
  }

  return (
    <article
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`group flex flex-col gap-3 border-b border-charcoal-border/30 py-4 last:border-b-0 transition-all duration-150 md:flex-row md:items-center md:justify-between ${
        isShaking ? "animate-shake-vertical border-offwhite/60 bg-charcoal-light/25 shadow-md" : ""
      } ${
        isDragging ? "opacity-35 bg-charcoal-light/30 border-dashed border-offwhite rounded-xl" : ""
      } ${
        isDragOver ? "border-t-2 border-t-terracotta bg-charcoal-lighter/25 pl-2 rounded-lg" : ""
      } ${available ? "" : "opacity-70"}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        {data.image ? (
          <Image
            src={data.image}
            alt={`Foto ${data.name}`}
            width={56}
            height={56}
            unoptimized
            className="h-14 w-14 shrink-0 rounded-lg border border-offwhite/10 object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-lg border border-offwhite/10 bg-charcoal-light/50 text-offwhite-darker"
          >
            <ImageIcon className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-sans text-base font-semibold text-offwhite">
              {data.name}
            </h3>
            {data.tags?.[0] && (
              <span className="rounded bg-terracotta/15 px-2 py-0.5 text-[11px] font-medium text-terracotta-light">
                {data.tags[0]}
              </span>
            )}
            {data.isFeatured && (
              <span className="rounded bg-offwhite/15 px-2 py-0.5 text-[11px] font-semibold text-offwhite">
                ★ Unggulan
              </span>
            )}
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                available
                  ? "border-offwhite/30 bg-offwhite/10 text-offwhite"
                  : "border-terracotta/40 bg-terracotta/15 text-terracotta-light"
              }`}
            >
              {available ? "✓ Tersedia" : "✕ Habis"}
            </span>
          </div>
          {data.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-offwhite-muted sm:text-sm">
              {data.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end">
        <strong className="text-sm font-semibold tabular-nums text-offwhite sm:text-base">
          {formatPrice(data.price)}
        </strong>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            draggable
            onClick={handleHandleClick}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            title="Tahan dan tarik untuk mengatur urutan"
            aria-label={`Tahan dan tarik untuk mengatur urutan ${data.name}`}
            className="hidden min-h-11 min-w-11 cursor-grab active:cursor-grabbing items-center justify-center rounded-xl border border-charcoal-border/70 bg-charcoal-light/30 text-offwhite-muted transition hover:border-offwhite/40 hover:text-offwhite sm:inline-flex"
          >
            ⋮⋮
          </button>
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            aria-label={`Pindahkan ${data.name} ke atas`}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-charcoal-border/70 bg-charcoal-light/30 px-2.5 text-sm text-offwhite-muted transition hover:border-offwhite/40 hover:text-offwhite disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={onMoveDown}
            aria-label={`Pindahkan ${data.name} ke bawah`}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-charcoal-border/70 bg-charcoal-light/30 px-2.5 text-sm text-offwhite-muted transition hover:border-offwhite/40 hover:text-offwhite disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            className="min-h-11 rounded-xl border border-charcoal-border/70 bg-charcoal-light/40 px-3.5 text-xs font-medium text-offwhite transition hover:border-offwhite/40 hover:bg-charcoal-light"
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            type="button"
            className="min-h-11 rounded-xl border border-charcoal-border/70 bg-charcoal-light/40 px-3.5 text-xs font-medium text-terracotta-light transition hover:border-terracotta/60 hover:bg-terracotta/10 hover:text-offwhite"
            onClick={onRemove}
          >
            Hapus
          </button>
        </div>
      </div>
    </article>
  );
}
