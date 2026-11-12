"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/ui/icons";
import { prefersReducedMotion } from "@/lib/motion";

export interface CraftChapter {
  id: string;
  number: string;
  shortTitle: string;
  title: string;
  summary: string;
  detail: string;
  src: string;
  alt: string;
}

const CHAPTERS: CraftChapter[] = [
  {
    id: "biji",
    number: "01",
    shortTitle: "Biji Pilihan",
    title: "Biji dari sumbernya",
    summary: "Single origin Sumatra & Jawa Barat dengan jadwal sangrai mingguan.",
    detail:
      "Kami beli langsung dari petani mitra dan hanya menyimpan batch segar agar rasa di cangkir konsisten tanpa perasa tambahan.",
    src: "/Image/Menu/V60.png",
    alt: "Kopi manual brew V60 dituang perlahan ke gelas sajian",
  },
  {
    id: "seduh",
    number: "02",
    shortTitle: "Seduh Terukur",
    title: "Seduh yang nggak buru-buru",
    summary: "Rasio air, suhu, dan gilingan dihitung di setiap gelas.",
    detail:
      "Dari pour-over V60 sampai kopi susu, tiap racikan ditimbang rapi supaya rasa akhirnya tetap seimbang saat dingin maupun hangat.",
    src: "/Image/Gallery/gal-02-morning-brew.jpg",
    alt: "Barista menyeduh kopi manual pagi hari di bar seduh",
  },
  {
    id: "ruang",
    number: "03",
    shortTitle: "Ruang Tenang",
    title: "Ruang buat duduk lama",
    summary: "Colokan dekat, cahaya teduh, dan kursi yang aman buat seharian.",
    detail:
      "Meja jendela untuk kerja sendiri, meja panjang untuk diskusi, dan area semi-outdoor teduh untuk sore yang lebih santai.",
    src: "/Image/Gallery/gal-06-lampu-bar.jpg",
    alt: "Tamu membaca dan duduk nyaman di area dalam kedai dekat jendela",
  },
];

export function AboutCraftShowcase(): React.JSX.Element {
  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const copyRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const hasChanged = useRef(false);

  const current = CHAPTERS[active] ?? CHAPTERS[0];

  useEffect(() => {
    if (!hasChanged.current || prefersReducedMotion()) return;

    if (stageRef.current) {
      const img = stageRef.current.querySelector("img");
      animate(stageRef.current, {
        opacity: [0.4, 1],
        duration: 420,
        ease: "outQuart",
      });
      if (img) {
        animate(img, {
          scale: [1.05, 1],
          duration: 680,
          ease: "outQuart",
        });
      }
    }

    if (copyRef.current) {
      animate(copyRef.current, {
        opacity: [0, 1],
        y: [10, 0],
        duration: 380,
        ease: "outQuart",
      });
    }
  }, [active]);

  const goTo = (nextIndex: number): void => {
    hasChanged.current = true;
    const total = CHAPTERS.length;
    setActive((nextIndex + total) % total);
  };

  return (
    <section
      aria-labelledby="craft-showcase-heading"
      className="border-t border-offwhite/10 bg-charcoal-darkest py-12 sm:py-14 lg:py-16"
    >
      <div className="public-container">
        {/* Header bar dengan kontrol slide ringkas */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta-light">
              Prinsip Kedai
            </p>
            <h2 id="craft-showcase-heading" className="public-h2 mt-2">
              Tiga hal yang kami jaga
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-serif text-sm text-offwhite-muted tabular-nums">
              <strong className="font-medium text-offwhite">{current.number}</strong>
              {" / "}0{CHAPTERS.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                aria-label="Prinsip sebelumnya"
                className="inline-flex size-11 items-center justify-center rounded-md border border-offwhite/20 text-offwhite transition hover:border-offwhite/45 hover:bg-charcoal-light"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                aria-label="Prinsip berikutnya"
                className="inline-flex size-11 items-center justify-center rounded-md border border-offwhite/20 text-offwhite transition hover:border-offwhite/45 hover:bg-charcoal-light"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Layout Utama: Daftar pemilih interaktif + Stage foto sinematik (tanpa 3 card kembar) */}
        <div className="mt-8 grid items-center gap-8 lg:mt-10 lg:grid-cols-12 lg:gap-10">
          {/* Mobile & Tablet tab bar (ringkas di atas foto) */}
          <div className="lg:hidden">
            <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Pilih prinsip kedai">
              {CHAPTERS.map((ch, idx) => (
                <button
                  key={ch.id}
                  type="button"
                  role="tab"
                  aria-selected={active === idx}
                  onClick={() => goTo(idx)}
                  className={`min-h-11 rounded-md border px-2.5 py-2 text-left transition ${
                    active === idx
                      ? "border-terracotta bg-terracotta/15 text-offwhite"
                      : "border-offwhite/15 bg-charcoal-light/40 text-offwhite-muted"
                  }`}
                >
                  <span className="block font-serif text-xs text-terracotta-light tabular-nums">
                    {ch.number}
                  </span>
                  <span className="block truncate text-xs font-medium">
                    {ch.shortTitle}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Kanan (di atas pada mobile, kanan pada desktop): Stage Foto Bersih dengan dukungan Swipe */}
          <div
            className="lg:order-2 lg:col-span-7"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const delta =
                (e.changedTouches[0]?.clientX ?? touchStartX.current) -
                touchStartX.current;
              touchStartX.current = null;
              if (Math.abs(delta) > 45) {
                goTo(delta < 0 ? active + 1 : active - 1);
              }
            }}
          >
            <div
              ref={stageRef}
              className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-offwhite/15 bg-charcoal-light lg:aspect-[16/10]"
            >
              <Image
                key={current.id}
                src={current.src}
                alt={current.alt}
                fill
                sizes="(min-width: 1024px) 680px, 100vw"
                className="object-cover"
              />
            </div>

            {/* Penjelasan ringkas untuk Mobile & Tablet di bawah foto */}
            <div ref={copyRef} className="mt-4 lg:hidden">
              <h3 className="font-serif text-2xl font-medium text-offwhite">
                {current.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-offwhite-muted sm:text-base">
                {current.detail}
              </p>
            </div>
          </div>

          {/* Desktop: Daftar bab editorial interaktif di kiri */}
          <div className="hidden lg:order-1 lg:col-span-5 lg:block">
            <ul className="divide-y divide-offwhite/12 border-y border-offwhite/12">
              {CHAPTERS.map((ch, idx) => {
                const isSelected = active === idx;
                return (
                  <li key={ch.id}>
                    <button
                      type="button"
                      onClick={() => goTo(idx)}
                      className="group w-full py-5 text-left transition"
                      aria-expanded={isSelected}
                    >
                      <div className="flex items-baseline gap-4">
                        <span
                          className={`font-serif text-xl tabular-nums transition-colors ${
                            isSelected
                              ? "text-terracotta-light"
                              : "text-offwhite-muted/55 group-hover:text-offwhite"
                          }`}
                        >
                          {ch.number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3
                            className={`font-serif text-xl font-medium transition-colors ${
                              isSelected
                                ? "text-offwhite"
                                : "text-offwhite/75 group-hover:text-offwhite"
                            }`}
                          >
                            {ch.title}
                          </h3>
                          <p className="mt-1 text-sm text-offwhite-muted">
                            {ch.summary}
                          </p>
                          {isSelected && (
                            <p className="mt-3 border-l-2 border-terracotta-light pl-3 text-sm leading-relaxed text-offwhite/90">
                              {ch.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-7 flex items-center gap-6">
              <Link
                href="/order"
                className="btn btn--primary min-h-11 gap-2 text-sm"
              >
                <span>Pesan menu</span>
                <ArrowRightIcon className="size-4" />
              </Link>
              <Link
                href="/location"
                className="link inline-flex min-h-11 items-center text-sm text-offwhite-muted hover:text-offwhite"
              >
                Lokasi & jam buka
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet footer CTA */}
        <div className="mt-7 flex flex-wrap items-center gap-4 lg:hidden">
          <Link
            href="/order"
            className="btn btn--primary min-h-11 flex-1 gap-2 text-sm sm:flex-none"
          >
            <span>Pesan menu</span>
            <ArrowRightIcon className="size-4" />
          </Link>
          <Link
            href="/location"
            className="inline-flex min-h-11 items-center rounded-md border border-offwhite/20 px-4 text-sm text-offwhite transition hover:border-offwhite/40"
          >
            Lokasi & jam buka
          </Link>
        </div>
      </div>
    </section>
  );
}

