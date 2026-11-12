"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import {
  MinusIcon,
  ParkingIcon,
  PlusIcon,
  SignpostIcon,
  TransitIcon,
} from "@/components/ui/icons";
import { prefersReducedMotion } from "@/lib/motion";
import type { FaqItem, TransportGuideItem } from "@/types";

interface Props {
  location: TransportGuideItem[];
  faq: FaqItem[];
}

function guideIcon(icon: TransportGuideItem["icon"]) {
  if (icon === "parking") return ParkingIcon;
  if (icon === "transit") return TransitIcon;
  return SignpostIcon;
}

export function LocationInteractiveGuides({
  location,
  faq,
}: Props): React.JSX.Element {
  const [activeGuide, setActiveGuide] = useState(0);
  const [openFaqId, setOpenFaqId] = useState<string | null>(
    faq[0]?.id ?? null,
  );
  const guidePanelRef = useRef<HTMLDivElement | null>(null);
  const hasSwitchedGuide = useRef(false);

  const selectedGuide = location[activeGuide] ?? location[0];

  useEffect(() => {
    if (!hasSwitchedGuide.current || !guidePanelRef.current || prefersReducedMotion()) {
      return;
    }
    animate(guidePanelRef.current, {
      opacity: [0, 1],
      y: [8, 0],
      duration: 320,
      ease: "outQuart",
    });
  }, [activeGuide]);

  const handleSelectGuide = (idx: number): void => {
    hasSwitchedGuide.current = true;
    setActiveGuide(idx);
  };

  return (
    <section
      aria-labelledby="location-guides-heading"
      className="bg-charcoal-darkest py-12 sm:py-16 lg:py-20"
    >
      <div className="public-container">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-12">
          {/* Kolom kiri: Panduan akses interaktif (menggantikan 3 card kembar) */}
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta-light">
              Panduan Kunjungan
            </p>
            <h2 id="location-guides-heading" className="public-h2 mt-2">
              Akses menuju kedai
            </h2>

            {location.length > 0 && (
              <>
                {/* Tab switcher ringkas untuk semua ukuran layar */}
                <div
                  className="mt-6 grid grid-cols-3 gap-2"
                  role="tablist"
                  aria-label="Pilih informasi akses"
                >
                  {location.map((guide, idx) => {
                    const Icon = guideIcon(guide.icon);
                    const isSelected = activeGuide === idx;
                    const shortName =
                      guide.icon === "parking"
                        ? "Parkir"
                        : guide.icon === "transit"
                          ? "Transit"
                          : "Patokan";
                    return (
                      <button
                        key={guide.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => handleSelectGuide(idx)}
                        className={`flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition sm:text-sm ${
                          isSelected
                            ? "border-terracotta bg-terracotta/15 text-offwhite"
                            : "border-offwhite/15 bg-charcoal-light/40 text-offwhite-muted hover:border-offwhite/35 hover:text-offwhite"
                        }`}
                      >
                        <Icon
                          className={`size-4 shrink-0 ${
                            isSelected
                              ? "text-terracotta-light"
                              : "text-offwhite-muted"
                          }`}
                        />
                        <span>{shortName}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedGuide && (
                  <div
                    ref={guidePanelRef}
                    role="tabpanel"
                    className="mt-5 rounded-lg border border-offwhite/12 bg-charcoal-light/50 p-5"
                  >
                    <h3 className="font-serif text-xl font-medium text-offwhite">
                      {selectedGuide.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-offwhite-muted sm:text-base">
                      {selectedGuide.description}
                    </p>
                    {selectedGuide.detail && (
                      <p className="mt-3 border-t border-offwhite/10 pt-3 text-xs leading-relaxed text-offwhite-darker sm:text-sm">
                        {selectedGuide.detail}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Kolom kanan: Accordion FAQ interaktif agar halaman ringkas dan mudah dipindai */}
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta-light">
              Informasi Kedai
            </p>
            <h2 className="public-h2 mt-2">Pertanyaan yang sering ditanya</h2>

            <div className="mt-6 divide-y divide-offwhite/12 border-y border-offwhite/12">
              {faq.map((item) => {
                const isOpen = openFaqId === item.id;
                return (
                  <div key={item.id} className="py-1">
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                      aria-expanded={isOpen}
                      className="flex min-h-12 w-full items-center justify-between gap-4 py-3.5 text-left transition hover:text-terracotta-light"
                    >
                      <span
                        className={`text-sm font-medium sm:text-base ${
                          isOpen ? "text-offwhite" : "text-offwhite/85"
                        }`}
                      >
                        {item.question}
                      </span>
                      <span
                        className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full border transition ${
                          isOpen
                            ? "border-terracotta bg-terracotta/15 text-terracotta-light"
                            : "border-offwhite/15 text-offwhite-muted"
                        }`}
                        aria-hidden="true"
                      >
                        {isOpen ? (
                          <MinusIcon className="size-3.5" />
                        ) : (
                          <PlusIcon className="size-3.5" />
                        )}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="pb-4 pr-10 text-sm leading-relaxed text-offwhite-muted">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
