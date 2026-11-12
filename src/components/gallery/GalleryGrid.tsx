"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { animate } from "animejs";
import { GalleryLightbox } from "./GalleryLightbox";
import { ChevronLeftIcon, ChevronRightIcon, ExpandIcon } from "@/components/ui/icons";
import { prefersReducedMotion, revealNow } from "@/lib/motion";
import type { GalleryPhoto } from "@/types";

const GALLERY_PAGE_SIZE = 9;

interface BentoCellSpec {
  colSpan: number;
  className: string;
}

/**
 * Menghitung tata letak bento 12-kolom yang SELALU genap di setiap baris untuk jumlah foto apa pun
 * (1, 2, 3, ..., 20, 50+) tanpa baris gantung sendirian atau strip sempit.
 */
function buildBentoSpecs(total: number): BentoCellSpec[] {
  if (total <= 0) return [];
  if (total === 1) {
    return [{ colSpan: 12, className: "md:col-span-12 aspect-[16/9]" }];
  }

  // Partisi total menjadi ukuran baris 2 atau 3 agar tidak pernah menyisakan 1 foto sendirian
  const rowSizes: number[] = [];
  let rem = total;
  let preferPair = true;

  while (rem > 0) {
    if (rem === 2) {
      rowSizes.push(2);
      rem -= 2;
    } else if (rem === 3) {
      rowSizes.push(3);
      rem -= 3;
    } else if (rem === 4) {
      rowSizes.push(2, 2);
      rem -= 4;
    } else if (preferPair) {
      rowSizes.push(2);
      rem -= 2;
      preferPair = false;
    } else {
      rowSizes.push(3);
      rem -= 3;
      preferPair = true;
    }
  }

  const specs: BentoCellSpec[] = [];
  let pairVariant = 0;

  for (const size of rowSizes) {
    if (size === 3) {
      for (let i = 0; i < 3; i += 1) {
        specs.push({
          colSpan: 4,
          className: "md:col-span-4 aspect-[4/5] md:h-[330px] lg:h-[370px] md:aspect-auto",
        });
      }
      continue;
    }

    // Variasikan pasangan 2-item agar ritme majalah tetap dinamis bahkan untuk puluhan foto
    const mod = pairVariant % 3;
    pairVariant += 1;
    if (mod === 0) {
      specs.push(
        {
          colSpan: 7,
          className: "md:col-span-7 aspect-[16/10] md:h-[360px] lg:h-[420px] md:aspect-auto",
        },
        {
          colSpan: 5,
          className: "md:col-span-5 aspect-[4/3] md:h-[360px] lg:h-[420px] md:aspect-auto",
        },
      );
    } else if (mod === 1) {
      specs.push(
        {
          colSpan: 5,
          className: "md:col-span-5 aspect-[4/3] md:h-[350px] lg:h-[400px] md:aspect-auto",
        },
        {
          colSpan: 7,
          className: "md:col-span-7 aspect-[16/10] md:h-[350px] lg:h-[400px] md:aspect-auto",
        },
      );
    } else {
      specs.push(
        {
          colSpan: 6,
          className: "md:col-span-6 aspect-[16/10] md:h-[320px] lg:h-[360px] md:aspect-auto",
        },
        {
          colSpan: 6,
          className: "md:col-span-6 aspect-[16/10] md:h-[320px] lg:h-[360px] md:aspect-auto",
        },
      );
    }
  }

  return specs;
}

/**
 * Menghasilkan span kolom mobile 2-kolom yang selalu rata dan tidak menyisakan lubang kosong.
 */
function buildMobileSpans(total: number): Array<"col-span-2 aspect-[16/9]" | "aspect-square"> {
  const result: Array<"col-span-2 aspect-[16/9]" | "aspect-square"> = [];
  let idx = 0;

  while (idx < total) {
    const remaining = total - idx;
    // Setiap kelipatan ke-5 boleh tampil penuh 2 kolom selama sisa di bawahnya masih seimbang
    if (remaining === 1) {
      result.push("col-span-2 aspect-[16/9]");
      idx += 1;
    } else if (idx > 0 && idx % 5 === 4 && remaining >= 3) {
      result.push("col-span-2 aspect-[16/9]");
      idx += 1;
    } else if (remaining >= 2) {
      result.push("aspect-square", "aspect-square");
      idx += 2;
    }
  }

  return result;
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
  const [visibleCount, setVisibleCount] = useState(GALLERY_PAGE_SIZE);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const mobileStageRef = useRef<HTMLDivElement | null>(null);
  const mobileTouchX = useRef<number | null>(null);
  const prevVisibleCount = useRef(GALLERY_PAGE_SIZE);

  // Reset jumlah tampil ke awal saat kategori / daftar foto berubah
  const photosSignature = useMemo(
    () => photos.map((p) => p.id).join(","),
    [photos],
  );
  useEffect(() => {
    setVisibleCount(GALLERY_PAGE_SIZE);
    setSpotlightIndex(0);
    prevVisibleCount.current = GALLERY_PAGE_SIZE;
  }, [photosSignature]);

  const visiblePhotos = useMemo(
    () => photos.slice(0, visibleCount),
    [photos, visibleCount],
  );
  const remainingCount = Math.max(0, photos.length - visiblePhotos.length);

  const bentoSpecs = useMemo(
    () => buildBentoSpecs(visiblePhotos.length),
    [visiblePhotos.length],
  );
  const mobileSpans = useMemo(
    () => buildMobileSpans(visiblePhotos.length),
    [visiblePhotos.length],
  );

  const safeSpotlightIndex = Math.min(
    spotlightIndex,
    Math.max(0, photos.length - 1),
  );
  const spotlightPhoto = photos[safeSpotlightIndex];

  useLayoutEffect(() => {
    if (!gridRef.current) return;
    const buttons = Array.from(
      gridRef.current.querySelectorAll<HTMLElement>(":scope > button"),
    );

    if (animateIn) {
      return revealNow(buttons, 55);
    }

    if (visibleCount > prevVisibleCount.current) {
      const newlyAdded = buttons.slice(prevVisibleCount.current);
      prevVisibleCount.current = visibleCount;
      if (newlyAdded.length) {
        return revealNow(newlyAdded, 50);
      }
    }
  }, [animateIn, photos, visibleCount]);

  useEffect(() => {
    if (!mobileStageRef.current || prefersReducedMotion()) return;
    animate(mobileStageRef.current, {
      opacity: [0.5, 1],
      duration: 320,
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

  const showMore = (): void => {
    prevVisibleCount.current = visiblePhotos.length;
    setVisibleCount((prev) => prev + GALLERY_PAGE_SIZE);
  };

  return (
    <>
      {/* Mobile View (< 768px): Sorotan Swipe Slider (menjelajah semua foto) + Indeks Bento 2-Kolom Bertahap */}
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
                const dx =
                  (e.changedTouches[0]?.clientX ?? mobileTouchX.current) -
                  mobileTouchX.current;
                mobileTouchX.current = null;
                if (Math.abs(dx) > 40 && photos.length > 1) {
                  stepSpotlight(dx < 0 ? 1 : -1);
                }
              }}
              className="relative aspect-[4/3] w-full overflow-hidden rounded-none border border-offwhite/15 bg-charcoal-light"
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
                <span className="absolute right-3 bottom-3 inline-flex size-9 items-center justify-center rounded-md border border-offwhite/25 bg-charcoal/80 text-offwhite">
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

        {visiblePhotos.length > 1 && (
          <div className="grid grid-cols-2 gap-2.5">
            {visiblePhotos.map((photo, idx) => {
              const spanClass = mobileSpans[idx] ?? "aspect-square";
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => {
                    setSpotlightIndex(idx);
                    setSelected(photo);
                  }}
                  aria-label={`Perbesar ${photo.alt || photo.title || "foto kedai"}`}
                  className={`m-zoom relative overflow-hidden rounded-none border bg-charcoal-light transition ${
                    idx === safeSpotlightIndex
                      ? "border-terracotta"
                      : "border-offwhite/10"
                  } ${spanClass}`}
                >
                  {photo.src && (
                    <Image
                      src={photo.src}
                      alt={photo.alt || photo.title || "Suasana CafeSite"}
                      fill
                      sizes={spanClass.includes("col-span-2") ? "100vw" : "48vw"}
                      unoptimized={!photo.src.startsWith("/Image/")}
                      className="object-cover"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tablet & Desktop View (>= 768px): Majalah Bento Dinamis 12-Kolom Tanpa Baris Kosong */}
      <div
        ref={gridRef}
        className="hidden gap-4 md:grid md:grid-cols-12 lg:gap-5"
      >
        {visiblePhotos.map((photo, index) => {
          const spec = bentoSpecs[index] ?? {
            colSpan: 4,
            className: "md:col-span-4 aspect-[4/3]",
          };
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => setSelected(photo)}
              className={`m-zoom group relative overflow-hidden rounded-none border border-offwhite/12 bg-charcoal-light text-left transition hover:border-offwhite/35 ${spec.className}`}
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
                    spec.colSpan >= 7
                      ? "(min-width: 1024px) 720px, 60vw"
                      : "(min-width: 1024px) 480px, 45vw"
                  }
                  unoptimized={!photo.src.startsWith("/Image/")}
                  className="object-cover"
                />
              )}
              <span
                className="pointer-events-none absolute right-3 bottom-3 inline-flex size-9 items-center justify-center rounded-md border border-offwhite/25 bg-charcoal-darkest/80 text-offwhite opacity-0 transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                aria-hidden="true"
              >
                <ExpandIcon className="size-4" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Tombol Muat Lebih Banyak saat jumlah foto bertumbuh (> 9 foto) */}
      {remainingCount > 0 && (
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-offwhite/12 pt-6 sm:flex-row">
          <p className="text-xs tabular-nums text-offwhite-muted sm:text-sm">
            Menampilkan {visiblePhotos.length} dari {photos.length} bingkai
          </p>
          <button
            type="button"
            onClick={showMore}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-terracotta/70 bg-terracotta/15 px-5 py-2.5 text-sm font-medium text-offwhite transition hover:border-terracotta hover:bg-terracotta hover:text-offwhite-pure"
          >
            Tampilkan {Math.min(GALLERY_PAGE_SIZE, remainingCount)} foto lainnya (sisa {remainingCount})
          </button>
        </div>
      )}

      <GalleryLightbox
        photo={selected}
        photos={photos}
        onClose={() => setSelected(null)}
        onSelectPhoto={setSelected}
      />
    </>
  );
}
