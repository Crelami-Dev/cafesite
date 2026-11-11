"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  CRAVING_FLAVORS,
  CRAVING_OPTIONS,
  type CravingId,
  type FlavorId,
} from "@/data/menu-picker";
import { getMenuRecommendation } from "@/lib/menu-recommendation";
import { formatPrice } from "@/lib/utils";
import { revealNow } from "@/lib/motion";
import type { MenuItem } from "@/types";

const OPTION_BASE =
  "flex min-h-11 flex-col items-start justify-center rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta";
const OPTION_ON = "border-terracotta bg-terracotta/15 font-medium text-offwhite";
const OPTION_OFF = "border-offwhite/20 bg-charcoal-light/40 text-offwhite hover:border-offwhite/40";

/**
 * "Bingung pesan apa?": pilih kategori, lalu pilih rasa yang memang ada di kategori itu
 * (pilihan rasa langkah 2 berganti mengikuti langkah 1), dan satu menu direkomendasikan.
 */
export function MenuPicker({ items }: { items: MenuItem[] }): React.JSX.Element {
  const [selectedCraving, setSelectedCraving] = useState<CravingId | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<FlavorId | null>(null);

  const flavorOptions = selectedCraving ? CRAVING_FLAVORS[selectedCraving] : null;

  const result =
    selectedCraving !== null && selectedFlavor !== null
      ? getMenuRecommendation(items, selectedCraving, selectedFlavor)
      : null;

  const handleCraving = (id: CravingId): void => {
    setSelectedCraving(id);
    // Rasa yang tidak tersedia di kategori baru dilepas, supaya tidak ada pasangan yang janggal.
    if (selectedFlavor && !CRAVING_FLAVORS[id].some((option) => option.id === selectedFlavor)) {
      setSelectedFlavor(null);
    }
  };

  const handleReset = (): void => {
    setSelectedCraving(null);
    setSelectedFlavor(null);
  };

  // Pilihan rasa muncul berurutan tiap kali kategori berganti.
  const flavorRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    if (!selectedCraving || !flavorRef.current) return;
    return revealNow(Array.from(flavorRef.current.querySelectorAll<HTMLElement>(":scope > button")), 60);
  }, [selectedCraving]);

  // Kartu rekomendasi naik pelan, fotonya terbuka, lalu teksnya menyusul.
  const resultRef = useRef<HTMLDivElement | null>(null);
  const resultKey = result ? `${result.item?.id ?? "none"}-${selectedCraving}-${selectedFlavor}` : null;
  useLayoutEffect(() => {
    const card = resultRef.current;
    if (!resultKey || !card) return;
    return revealNow([card, ...Array.from(card.querySelectorAll<HTMLElement>("[data-picker-part]"))], 90);
  }, [resultKey]);

  return (
    <section
      id="rekomendasi-menu"
      aria-labelledby="picker-heading"
      className="border-t border-offwhite/15 bg-charcoal py-14 text-offwhite md:py-24"
    >
      <Container>
        <div className="max-w-2xl" data-reveal>
          <h2 id="picker-heading" className="public-h2">
            Bingung pesan <em className="italic">apa</em>?
          </h2>
          <p className="mt-3 text-base text-offwhite-muted">
            Pilih dua hal ini, biar kami yang carikan pasangan pasnya.
          </p>
        </div>

        <div className="mt-10 grid gap-8 md:mt-12">
          <fieldset className="border-0 p-0">
            <legend className="text-sm font-medium uppercase tracking-wider text-offwhite-muted" data-reveal>
              1. Lagi pengin apa?
            </legend>
            <div
              className="mt-4 grid grid-cols-2 gap-3 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2 lg:grid-cols-5"
              data-reveal-group
            >
              {CRAVING_OPTIONS.map((option) => {
                const isSelected = selectedCraving === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleCraving(option.id)}
                    className={`${OPTION_BASE} ${isSelected ? OPTION_ON : OPTION_OFF}`}
                  >
                    <span className="text-base font-medium leading-snug">{option.label}</span>
                    <span className="mt-0.5 text-xs text-offwhite-muted">{option.sublabel}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="border-0 p-0" data-reveal>
            <legend className="text-sm font-medium uppercase tracking-wider text-offwhite-muted">
              2. Rasanya mau yang gimana?
            </legend>
            {flavorOptions ? (
              <div
                ref={flavorRef}
                key={selectedCraving}
                className={`mt-4 grid gap-2 sm:gap-3 ${flavorOptions.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}
              >
                {flavorOptions.map((option) => {
                  const isSelected = selectedFlavor === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedFlavor(option.id)}
                      className={`${OPTION_BASE} ${isSelected ? OPTION_ON : OPTION_OFF}`}
                    >
                      <span className="text-base font-medium leading-snug">{option.label}</span>
                      <span className="mt-0.5 text-xs text-offwhite-muted max-sm:hidden">{option.sublabel}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-base text-offwhite-muted">
                Pilih dulu langkah pertama. Pilihan rasanya menyesuaikan.
              </p>
            )}
          </fieldset>
        </div>

        <div aria-live="polite" className="mt-10">
          {result !== null && (
            <div ref={resultRef} className="rounded-xl border border-offwhite/15 bg-charcoal-light p-6">
              {result.item ? (
                <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)] md:items-center">
                  {result.item.image && (
                    <div
                      className="relative aspect-[4/3] overflow-hidden rounded-lg bg-charcoal"
                      data-picker-part
                      data-reveal="wipe"
                    >
                      <Image
                        src={result.item.image}
                        alt={result.item.name}
                        fill
                        sizes="(min-width: 768px) 240px, 100vw"
                        unoptimized={!result.item.image.startsWith("/Image/")}
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-col justify-between" data-picker-part>
                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h3 className="font-serif text-2xl font-medium text-offwhite">{result.item.name}</h3>
                        <span className="text-lg font-medium tabular-nums text-offwhite">
                          {formatPrice(result.item.price)}
                        </span>
                      </div>
                      <p className="mt-2 text-base text-offwhite-muted">{result.reason}</p>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-4">
                      <Button href="/order">Pesan ini ↗</Button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="link inline-flex min-h-11 items-center text-sm text-offwhite-muted hover:text-offwhite"
                      >
                        Coba lagi
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-base text-offwhite-muted">{result.reason}</p>
                  <div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="link inline-flex min-h-11 items-center text-sm text-offwhite-muted hover:text-offwhite"
                    >
                      Coba lagi
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
