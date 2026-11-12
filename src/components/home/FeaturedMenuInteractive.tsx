"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { animate } from "animejs";
import { ProgressiveImage } from "@/components/ui/ProgressiveImage";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { prefersReducedMotion } from "@/lib/motion";
import { formatPrice } from "@/lib/utils";
import type { MenuItem } from "@/types";

type MenuGroupId = "all" | "drink" | "food";

const MENU_GROUPS: Array<{ id: MenuGroupId; label: string }> = [
  { id: "all", label: "Favorit" },
  { id: "drink", label: "Minuman" },
  { id: "food", label: "Makanan & Roti" },
];

const CATEGORY_LABEL: Record<MenuItem["category"], string> = {
  coffee: "Kopi",
  "non-coffee": "Non-Kopi",
  food: "Makanan",
  snack: "Camilan",
  dessert: "Roti & Manis",
};

const MAX_BOARD_ITEMS = 6;

function isDrinkCategory(category: MenuItem["category"]): boolean {
  return category === "coffee" || category === "non-coffee";
}

export function FeaturedMenuInteractive({
  items,
}: {
  items: MenuItem[];
}): React.JSX.Element {
  const [group, setGroup] = useState<MenuGroupId>("all");
  const [activeId, setActiveId] = useState<string>(() => items[0]?.id ?? "");

  const spotlightMediaRef = useRef<HTMLDivElement | null>(null);
  const spotlightCopyRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const hasInteracted = useRef(false);

  const visibleItems = useMemo(() => {
    const filtered =
      group === "all"
        ? items
        : group === "drink"
          ? items.filter((item) => isDrinkCategory(item.category))
          : items.filter((item) => !isDrinkCategory(item.category));

    const pool = filtered.length > 0 ? filtered : items;
    return pool.slice(0, MAX_BOARD_ITEMS);
  }, [items, group]);

  const activeIndex = Math.max(
    0,
    visibleItems.findIndex((item) => item.id === activeId),
  );
  const activeItem = visibleItems[activeIndex] ?? visibleItems[0];

  useEffect(() => {
    if (!hasInteracted.current || prefersReducedMotion()) return;

    if (spotlightMediaRef.current) {
      const img = spotlightMediaRef.current.querySelector("img");
      animate(spotlightMediaRef.current, {
        opacity: [0.55, 1],
        duration: 320,
        ease: "outQuart",
      });
      if (img) {
        animate(img, {
          scale: [1.04, 1],
          duration: 540,
          ease: "outQuart",
        });
      }
    }

    if (spotlightCopyRef.current) {
      animate(spotlightCopyRef.current, {
        opacity: [0, 1],
        y: [6, 0],
        duration: 300,
        ease: "outQuart",
      });
    }
  }, [activeItem?.id]);

  const selectItem = (id: string): void => {
    if (id === activeItem?.id) return;
    hasInteracted.current = true;
    setActiveId(id);
  };

  const handleGroupChange = (nextGroup: MenuGroupId): void => {
    hasInteracted.current = true;
    setGroup(nextGroup);
    const nextPool =
      nextGroup === "all"
        ? items
        : nextGroup === "drink"
          ? items.filter((item) => isDrinkCategory(item.category))
          : items.filter((item) => !isDrinkCategory(item.category));
    if (nextPool[0]) {
      setActiveId(nextPool[0].id);
    }
  };

  const stepActive = (delta: number): void => {
    if (visibleItems.length <= 1) return;
    const nextIdx = (activeIndex + delta + visibleItems.length) % visibleItems.length;
    const nextItem = visibleItems[nextIdx];
    if (nextItem) selectItem(nextItem.id);
  };

  const availableGroups = MENU_GROUPS.filter((g) => {
    if (g.id === "all") return true;
    if (g.id === "drink") return items.some((i) => isDrinkCategory(i.category));
    return items.some((i) => !isDrinkCategory(i.category));
  });

  if (!activeItem) {
    return <p className="mt-8 text-offwhite-muted">Menu sedang diperbarui.</p>;
  }

  const badgeText = activeItem.tags?.includes("Best Seller")
    ? "Paling sering dipesan"
    : CATEGORY_LABEL[activeItem.category] ?? "Pilihan kedai";

  return (
    <div className="mt-7 md:mt-10">
      {/* Grid Utama: Spotlight Menu Kiri + Papan Daftar Interaktif Kanan */}
      <div className="grid items-stretch gap-7 md:grid-cols-12 md:gap-7 lg:gap-10">
        {/* Kolom Spotlight Menu Aktif */}
        <article
          className="flex flex-col rounded-none border border-offwhite/12 bg-charcoal p-4 sm:p-5 md:col-span-5"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx =
              (e.changedTouches[0]?.clientX ?? touchStartX.current) -
              touchStartX.current;
            touchStartX.current = null;
            if (Math.abs(dx) > 45) {
              stepActive(dx < 0 ? 1 : -1);
            }
          }}
        >
          <div
            ref={spotlightMediaRef}
            className="relative aspect-[16/10] w-full overflow-hidden rounded-none bg-charcoal-light md:aspect-[5/4]"
          >
            {activeItem.image ? (
              <ProgressiveImage
                key={activeItem.id}
                src={activeItem.image}
                alt={activeItem.name}
                fill
                unoptimized={!activeItem.image.startsWith("/Image/")}
                sizes="(min-width: 1024px) 440px, (min-width: 768px) 42vw, calc(100vw - 64px)"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-offwhite-muted">
                Foto belum tersedia
              </div>
            )}

            {/* Pager Mobile langsung pada sudut bingkai foto */}
            {visibleItems.length > 1 && (
              <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5 md:hidden">
                <button
                  type="button"
                  onClick={() => stepActive(-1)}
                  aria-label="Menu sebelumnya"
                  className="inline-flex size-9 items-center justify-center rounded-md border border-offwhite/25 bg-charcoal/85 text-offwhite backdrop-blur-sm"
                >
                  <ChevronLeftIcon className="size-4" />
                </button>
                <span className="rounded-md border border-offwhite/20 bg-charcoal/85 px-2.5 py-1 text-[11px] font-medium tabular-nums text-offwhite backdrop-blur-sm">
                  {activeIndex + 1}/{visibleItems.length}
                </span>
                <button
                  type="button"
                  onClick={() => stepActive(1)}
                  aria-label="Menu berikutnya"
                  className="inline-flex size-9 items-center justify-center rounded-md border border-offwhite/25 bg-charcoal/85 text-offwhite backdrop-blur-sm"
                >
                  <ChevronRightIcon className="size-4" />
                </button>
              </div>
            )}
          </div>

          <div ref={spotlightCopyRef} className="mt-4 flex flex-1 flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-terracotta-light">
                {badgeText}
              </p>
              <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 md:flex-col lg:flex-row">
                <h3 className="font-serif text-2xl leading-tight text-offwhite sm:text-[28px]">
                  {activeItem.name}
                </h3>
                <span className="shrink-0 text-lg font-semibold tabular-nums text-offwhite">
                  {formatPrice(activeItem.price)}
                </span>
              </div>
              {activeItem.description && (
                <p className="mt-2.5 text-sm leading-relaxed text-offwhite-muted sm:text-[15px]">
                  {activeItem.description}
                </p>
              )}
            </div>

            <div className="mt-5 pt-2">
              <Link
                href={`/order?add=${encodeURIComponent(activeItem.id)}`}
                className="btn btn--primary min-h-11 w-full justify-center gap-2 text-sm lg:w-auto"
              >
                <span>Pesan menu ini</span>
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
          </div>
        </article>

        {/* Kolom Kanan: Papan Daftar Harga Interaktif tanpa potongan teks menggantung */}
        <div className="flex flex-col justify-between md:col-span-7">
          <ul
            className="divide-y divide-offwhite/12 border-y border-offwhite/12"
            aria-label="Daftar pilihan menu favorit"
          >
            {visibleItems.map((item) => {
              const isSelected = item.id === activeItem.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => selectItem(item.id)}
                    aria-current={isSelected ? "true" : undefined}
                    className={`group flex w-full items-center gap-3.5 py-3.5 text-left transition sm:gap-4 sm:py-4 ${isSelected
                        ? "border-l-2 border-terracotta-light bg-charcoal/55 pl-3.5 pr-3 sm:pl-4"
                        : "pl-0 pr-2 hover:bg-charcoal/25"
                      }`}
                  >
                    {/* Thumbnail bersih hanya untuk Tablet & Desktop agar Mobile tetap ringkas satu baris */}
                    {item.image && (
                      <span className="relative hidden size-14 shrink-0 overflow-hidden rounded-none border border-offwhite/10 bg-charcoal md:block">
                        <ProgressiveImage
                          src={item.image}
                          alt={item.name}
                          fill
                          unoptimized={!item.image.startsWith("/Image/")}
                          sizes="56px"
                          className="object-cover"
                        />
                      </span>
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2.5">
                        <span
                          className={`truncate text-[15px] font-medium transition-colors sm:text-[17px] ${isSelected
                              ? "text-terracotta-light"
                              : "text-offwhite group-hover:text-terracotta-light"
                            }`}
                        >
                          {item.name}
                        </span>
                        <span
                          className="hidden flex-1 border-b border-dotted border-offwhite/25 sm:block"
                          aria-hidden="true"
                        />
                        <span className="ml-auto shrink-0 text-sm font-medium tabular-nums text-offwhite sm:ml-0 sm:text-base">
                          {formatPrice(item.price)}
                        </span>
                      </span>

                      <span className="mt-1 hidden items-center gap-2 text-xs text-offwhite-muted md:flex">
                        <span className="shrink-0 uppercase tracking-wider text-offwhite-darker">
                          {CATEGORY_LABEL[item.category]}
                        </span>
                        {item.tags?.includes("Best Seller") && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-terracotta-light">Favorit Kedai</span>
                          </>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex items-center justify-between gap-4 text-xs text-offwhite-muted sm:text-sm">
            <span>Menampilkan {visibleItems.length} pilihan dari menu aktif.</span>
            <Link
              href="/menu"
              className="link shrink-0 font-medium text-offwhite"
            >
              Semua daftar menu ↗
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

