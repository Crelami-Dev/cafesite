"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  CRAVING_OPTIONS,
  FLAVOR_OPTIONS,
  type CravingId,
  type FlavorId,
} from "@/data/menu-picker";
import { getMenuRecommendation } from "@/lib/menu-recommendation";
import { formatPrice } from "@/lib/utils";
import type { MenuItem } from "@/types";

export function MenuPicker({ items }: { items: MenuItem[] }): React.JSX.Element {
  const [selectedCraving, setSelectedCraving] = useState<CravingId | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<FlavorId | null>(null);

  const result =
    selectedCraving !== null && selectedFlavor !== null
      ? getMenuRecommendation(items, selectedCraving, selectedFlavor)
      : null;

  const handleReset = () => {
    setSelectedCraving(null);
    setSelectedFlavor(null);
  };

  return (
    <section
      id="rekomendasi-menu"
      aria-labelledby="picker-heading"
      className="border-t border-offwhite/15 bg-charcoal py-14 text-offwhite md:py-24"
    >
      <Container>
        <div className="max-w-2xl">
          <h2 id="picker-heading" className="public-h2">
            Bingung pesan <em className="italic">apa</em>?
          </h2>
          <p className="mt-3 text-base text-offwhite-muted">
            Pilih dua hal ini, biar kami yang carikan pasangan pasnya.
          </p>
        </div>

        <div className="mt-10 grid gap-8 md:mt-12">
          <fieldset className="border-0 p-0">
            <legend className="text-sm font-medium uppercase tracking-wider text-offwhite-muted">
              1. Lagi pengin apa?
            </legend>
            <div className="mt-4 grid grid-cols-2 gap-3 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2 lg:grid-cols-5">
              {CRAVING_OPTIONS.map((option) => {
                const isSelected = selectedCraving === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedCraving(option.id)}
                    className={`flex min-h-11 flex-col items-start justify-center rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                      isSelected
                        ? "border-terracotta bg-terracotta/15 font-medium text-offwhite"
                        : "border-offwhite/20 bg-charcoal-light/40 text-offwhite hover:border-offwhite/40"
                    }`}
                  >
                    <span className="text-base font-medium leading-snug">
                      {option.label}
                    </span>
                    <span className="mt-0.5 text-xs text-offwhite-muted">
                      {option.sublabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="border-0 p-0">
            <legend className="text-sm font-medium uppercase tracking-wider text-offwhite-muted">
              2. Preferensi rasa?
            </legend>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              {FLAVOR_OPTIONS.map((option) => {
                const isSelected = selectedFlavor === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedFlavor(option.id)}
                    className={`flex min-h-11 flex-col items-start justify-center rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                      isSelected
                        ? "border-terracotta bg-terracotta/15 font-medium text-offwhite"
                        : "border-offwhite/20 bg-charcoal-light/40 text-offwhite hover:border-offwhite/40"
                    }`}
                  >
                    <span className="text-base font-medium leading-snug">
                      {option.label}
                    </span>
                    <span className="mt-0.5 text-xs max-sm:hidden text-offwhite-muted">
                      {option.sublabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div aria-live="polite" className="mt-10">
          {result !== null && (
            <div className="rounded-xl border border-offwhite/15 bg-charcoal-light p-6">
              {result.item ? (
                <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)] md:items-center">
                  {result.item.image && (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-charcoal">
                      <Image
                        src={result.item.image}
                        alt={result.item.name}
                        fill
                        sizes="(min-width: 768px) 240px, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h3 className="font-serif text-2xl font-medium text-offwhite">
                          {result.item.name}
                        </h3>
                        <span className="text-lg font-medium tabular-nums text-offwhite">
                          {formatPrice(result.item.price)}
                        </span>
                      </div>
                      <p className="mt-2 text-base text-offwhite-muted">
                        {result.reason}
                      </p>
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
                  <p className="text-base text-offwhite-muted">
                    {result.reason}
                  </p>
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
