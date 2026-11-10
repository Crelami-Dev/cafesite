"use client";
import Image from "next/image";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import type { OrderMenuCardProps } from "@/types";
export function OrderMenuCard({
  item,
  quantity,
  onAdd,
  onDecrease,
}: OrderMenuCardProps): React.JSX.Element {
  const [failed, setFailed] = useState(false);
  return (
    <article className="order-card flex gap-5 border-b border-offwhite/15 py-6">
      <div className="order-card-image relative h-28 w-28 shrink-0 overflow-hidden bg-charcoal-light">
        {item.image && !failed ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width:639px) 100vw, 112px"
            className="object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <span
            className="grid h-full place-items-center font-serif text-4xl text-offwhite-muted"
            aria-hidden="true"
          >
            {item.name[0]}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-serif text-xl leading-snug">{item.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-offwhite-muted">
          {item.description.split(". ")[0]}.
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <p className="text-base font-semibold tabular-nums text-terracotta">{formatPrice(item.price)}</p>
          {quantity > 0 ? (
            <div className="flex items-center border border-offwhite/30 rounded-md bg-charcoal-light">
              <button
                type="button"
                className="taste-btn-press grid h-11 w-11 place-items-center text-offwhite hover:text-terracotta"
                onClick={onDecrease}
                aria-label={`Kurangi ${item.name}`}
              >
                <MinusIcon className="h-4 w-4" />
              </button>
              <span className="min-w-6 text-center text-sm font-medium text-offwhite" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                className="taste-btn-press grid h-11 w-11 place-items-center text-offwhite hover:text-terracotta disabled:opacity-40"
                disabled={quantity >= 20}
                onClick={onAdd}
                aria-label={`Tambah ${item.name}`}
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn--secondary taste-btn-press hover:border-offwhite"
              onClick={onAdd}
              aria-label={`Tambah ${item.name}`}
            >
              Tambah +
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
