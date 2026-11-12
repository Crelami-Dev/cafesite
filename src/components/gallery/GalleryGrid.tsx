"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { animate } from "animejs";
import { GalleryLightbox } from "./GalleryLightbox";
import { ChevronLeftIcon, ChevronRightIcon, ExpandIcon } from "@/components/ui/icons";
import { prefersReducedMotion, revealNow } from "@/lib/motion";
import type { GalleryPhoto } from "@/types";

/**
 * Mengembalikan kelas grid 12-kolom untuk desktop & tablet tanpa baris menggantung kosong.
 */
function bentoLayoutClass(index: number, total: number): string {
  if (total === 1) {
    return "md:col-span-12 aspect-[16/9]";
  }
  if (total === 2) {
    return index === 0
      ? "md:col-span-7 aspect-[16/10] md:h-[380px] lg:h-[440px] md:aspect-auto"
      : "md:col-span-5 aspect-[4/3] md:h-[380px] lg:h-[440px] md:aspect-auto";
  }
  if (total === 3) {
    if (index === 0) {
      return "md:col-span-7 aspect-[16/10] md:aspect-[4/3] lg:h-[420px] lg:aspect-auto";
    }
    return index === 1
      ? "md:col-span-5 aspect-[4/3] lg:h-[420px] lg:aspect-auto"
      : "md:col-span-12 aspect-[16/7]";
  }

  // Untuk 4+ foto: padukan ritme [7 + 5] dan [4 + 4 + 4] atau [5 + 7] dan [6 + 6]
  if (total === 9) {
    if (index === 0) return "md:col-span-7 aspect-[16/10] md:h-[360px] lg:h-[420px] md:aspect-auto";
    if (index === 1) return "md:col-span-5 aspect-[4/3] md:h-[360px] lg:h-[420px] md:aspect-auto";
    if (index >= 2 && index <= 4) return "md:col-span-4 aspect-[4/5] md:h-[340px] lg:h-[380px] md:aspect-auto";
    if (index === 5) return "md:col-span-5 aspect-[4/3] md:h-[360px] lg:h-[410px] md:aspect-auto";
    if (index === 6) return "md:col-span-7 aspect-[16/10] md:h-[360px] lg:h-[410px] md:aspect-auto";
    return "md:col-span-6 aspect-[16/10] md:h-[320px] lg:h-[360px] md:aspect-auto";
  }

  const pairRemainder = total % 2;
  if (pairRemainder === 1 && index === total - 1) {
    return "md:col-span-12 aspect-[21/9]";
  }
  const blockPos = index % 4;
  if (blockPos === 0) return "md:col-span-7 aspect-[16/10] md:h-[360px] lg:h-[400px] md:aspect-auto";
  if (blockPos === 1) return "md:col-span-5 aspect-[4/3] md:h-[360px] lg:h-[400px] md:aspect-auto";
  if (blockPos === 2) return "md:col-span-5 aspect-[4/3] md:h-[340px] lg:h-[380px] md:aspect-auto";
  return "md:col-span-7 aspect-[16/10] md:h-[340px] lg:h-[380px] md:aspect-auto";
}

export function GalleryGrid({
  photos,
  animateIn = false,
}: {
  photos: GalleryPhoto[];
  animateIn?: boolean;
}): React.JSX.Element {
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const mobileStageRef = useRef<HTMLDivElement | null>(null);
  const mobileTouchX = useRef<number | null>(null);

  const safeSpotlightIndex = Math.min(spotlightIndex, Math.max(0, photos.length - 1));
  const spotlightPhoto = photos[safeSpotlightIndex];

  useLayoutEffect(() => {
    if (!animateIn || !gridRef.current) return;
    return revealNow(
      Array.from(gridRef.current.querySelectorAll<HTMLElement>(":scope > button")),
      55,
    );
  }, [animateIn, photos]);

  useEffect(() => {
    if (!mobileStageRef.current || prefersReducedMotion()) return;
    animate(mobileStageRef.current, {
      opacity: [0.5, 1],
      duration: 340,
      ease: "outQuart",
    });
  }, [safeSpotlightIndex]);

  if (!photos.length) {
    return (
      <p className="py-12 text-offwhite-muted">
        Belum ada foto di kategori ini.
      </p>
    );
  }

  const stepSpotlight = (delta: number): void => {
    setSpotlightIndex((prev) => (prev + delta + photos.length) % photos.length);
  };

  return (
    <>
      {/* Mobile View (< 768px): Sorotan Swipe Slider + Indeks 2-Kolom Padat (ringkas, tanpa scroll panjang) */}
      <div className="md:hidden">
        {spotlightPhoto && (
          <div className="mb-6">
            <div
              ref={mobileStageRef}
              onTouchStart={(e) => {
                mobileTouchX.current = e.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                if (mobileTouchX.current === null) return;
                const dx = (e.changedTouches[0]?.clientX ?? mobileTouchX.current) - mobileTouchX.current;
                mobileTouchX.current = null;
                if (Math.abs(dx) > 40 && photos.length > 1) {
                  stepSpotlight(dx < 0 ? 1 : -1);
                }
              }}
              className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-offwhite/15 bg-charcoal-light"
            >
              <button
                type="button"
                onClick={() => setSelected(spotlightPhoto)}
                className="relative block h-full w-full text-left"
                aria-label={`Perbesar ${spotlightPhoto.alt || spotlightPhoto.title || "foto kedai"}`}
              >
                {spotlightPhoto.src && (
                  <Image
                    src={spotlightPhoto.src}
                    alt={spotlightPhoto.alt || spotlightPhoto.title || "Suasana CafeSite"}
                    fill
                    sizes="100vw"
                    unoptimized={!spotlightPhoto.src.startsWith("/Image/")}
                    className="object-cover"
                  />
                )}
                <span className="absolute right-3 bottom-3 inline-flex size-9 items-center justify-center rounded-full border border-offwhite/25 bg-charcoal/80 text-offwhite">
                  <ExpandIcon className="size-4" />
                </span>
              </button>
            </div>

            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-serif text-lg leading-snug text-offwhite">
                  {spotlightPhoto.title || "Suasana CafeSite"}
                </p>
                {spotlightPhoto.caption && (
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-offwhite-muted">
                    {spotlightPhoto.caption}
                  </p>
                )}
              </div>

              {photos.length > 1 && (
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="mr-1 text-xs tabular-nums text-offwhite-muted">
                    {safeSpotlightIndex + 1}/{photos.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => stepSpotlight(-1)}
                    aria-label="Foto sebelumnya"
                    className="inline-flex size-10 items-center justify-center rounded-md border border-offwhite/20 text-offwhite"
                  >
                    <ChevronLeftIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepSpotlight(1)}
                    aria-label="Foto berikutnya"
                    className="inline-flex size-10 items-center justify-center rounded-md border border-offwhite/20 text-offwhite"
                  >
                    <ChevronRightIcon className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {photos.length > 1 && (
          <div className="grid grid-cols-2 gap-2.5">
            {photos.map((photo, idx) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => {
                  setSpotlightIndex(idx);
                  setSelected(photo);
                }}
                aria-label={`Perbesar ${photo.alt || photo.title || "foto kedai"}`}
                className={`m-zoom relative overflow-hidden rounded-lg border bg-charcoal-light transition ${
                  idx === safeSpotlightIndex
                    ? "border-terracotta"
                    : "border-offwhite/10"
                } ${idx % 5 === 4 ? "col-span-2 aspect-[16/9]" : "aspect-square"}`}
              >
                {photo.src && (
                  <Image
                    src={photo.src}
                    alt={photo.alt || photo.title || "Suasana CafeSite"}
                    fill
                    sizes={idx % 5 === 4 ? "100vw" : "48vw"}
                    unoptimized={!photo.src.startsWith("/Image/")}
                    className="object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tablet & Desktop View (>= 768px): Majalah Bento Asimetris, Bersih Tanpa Caption Overlay Permanen */}
      <div
        ref={gridRef}
        className="hidden gap-4 md:grid md:grid-cols-12 lg:gap-5"
      >
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setSelected(photo)}
            className={`m-zoom group relative overflow-hidden rounded-lg border border-offwhite/12 bg-charcoal-light text-left transition hover:border-offwhite/35 ${bentoLayoutClass(index, photos.length)}`}
            aria-label={`Perbesar ${photo.alt || photo.title || "foto kedai"}`}
            data-reveal={animateIn ? undefined : true}
            data-moment={index === 0 ? "picture-develops" : undefined}
            data-moment-opts={index === 0 ? '{"look":"film"}' : undefined}
          >
            {photo.src && (
              <Image
                src={photo.src}
                alt={photo.alt || photo.title || "Suasana CafeSite"}
                fill
                sizes={
                  index === 0 || photos.length === 1
                    ? "(min-width: 1024px) 720px, 60vw"
                    : "(min-width: 1024px) 480px, 50vw"
                }
                unoptimized={!photo.src.startsWith("/Image/")}
                className="object-cover"
              />
            )}
            <span
              className="pointer-events-none absolute right-3 bottom-3 inline-flex size-9 items-center justify-center rounded-full border border-offwhite/25 bg-charcoal-darkest/80 text-offwhite opacity-0 transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
              aria-hidden="true"
            >
              <ExpandIcon className="size-4" />
            </span>
          </button>
        ))}
      </div>

      <GalleryLightbox
        photo={selected}
        photos={photos}
        onClose={() => setSelected(null)}
        onSelectPhoto={setSelected}
      />
    </>
  );
}
