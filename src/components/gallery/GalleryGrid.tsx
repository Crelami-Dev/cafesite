"use client";
import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { GalleryLightbox } from "./GalleryLightbox";
import { revealNow } from "@/lib/motion";
import type { GalleryPhoto } from "@/types";
export function GalleryGrid({
  photos,
  animateIn = false,
}: {
  photos: GalleryPhoto[];
  /** true setelah pengunjung mengganti kategori: foto hasil filter muncul berurutan. */
  animateIn?: boolean;
}): React.JSX.Element {
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    if (!animateIn || !gridRef.current) return;
    return revealNow(Array.from(gridRef.current.querySelectorAll<HTMLElement>(":scope > button")), 50);
  }, [animateIn]);
  if (!photos.length)
    return (
      <p className="py-12 text-offwhite-muted">
        Belum ada foto di kategori ini.
      </p>
    );
  return (
    <>
      <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => setSelected(photo)}
            className="m-zoom relative block aspect-[4/3] overflow-hidden bg-charcoal-light text-left"
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
                sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                unoptimized={!photo.src.startsWith("/Image/")}
                className="object-cover"
              />
            )}
            {(photo.title || photo.caption) && (
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-charcoal-darkest/80 px-3.5 py-2.5 text-offwhite">
                {photo.title && (
                  <strong className="block truncate text-sm font-medium">
                    {photo.title}
                  </strong>
                )}
                {photo.caption && (
                  <span className="block truncate text-xs text-offwhite-muted">
                    {photo.caption}
                  </span>
                )}
              </span>
            )}
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
