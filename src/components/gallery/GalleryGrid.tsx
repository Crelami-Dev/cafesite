"use client";
import { useState } from "react";
import Image from "next/image";
import { GalleryLightbox } from "./GalleryLightbox";
import type { GalleryPhoto } from "@/types";
export function GalleryGrid({
  photos,
}: {
  photos: GalleryPhoto[];
}): React.JSX.Element {
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);
  if (!photos.length)
    return (
      <p className="py-12 text-offwhite-muted">
        Belum ada foto di kategori ini.
      </p>
    );
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => setSelected(photo)}
            className="m-zoom relative block aspect-[4/3] overflow-hidden bg-charcoal-light text-left"
            aria-label={`Perbesar ${photo.alt || photo.title || "foto kedai"}`}
            data-moment={index === 0 ? "picture-develops" : undefined}
            data-moment-opts={index === 0 ? '{"look":"film"}' : undefined}
          >
            {photo.src && (
              <Image
                src={photo.src}
                alt={photo.alt || photo.title || "Suasana CafeSite"}
                fill
                sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
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
