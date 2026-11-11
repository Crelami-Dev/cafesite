"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
} from "@/components/ui/icons";
import type { GalleryPhoto } from "@/types";
interface Props {
  photo: GalleryPhoto | null;
  photos: GalleryPhoto[];
  onClose: () => void;
  onSelectPhoto: (photo: GalleryPhoto) => void;
}
export function GalleryLightbox({
  photo,
  photos,
  onClose,
  onSelectPhoto,
}: Props): React.JSX.Element | null {
  const dialog = useRef<HTMLDivElement>(null);
  const index = photo ? photos.findIndex((p) => p.id === photo.id) : -1;
  useEffect(() => {
    if (!photo) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const key = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")
        onSelectPhoto(photos[(index - 1 + photos.length) % photos.length]);
      if (e.key === "ArrowRight")
        onSelectPhoto(photos[(index + 1) % photos.length]);
      if (e.key === "Tab") {
        const elements = Array.from(
          dialog.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
        );
        if (e.shiftKey && document.activeElement === elements[0]) {
          e.preventDefault();
          elements.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === elements.at(-1)) {
          e.preventDefault();
          elements[0]?.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [photo, index, photos, onClose, onSelectPhoto]);
  if (!photo) return null;
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-charcoal-darkest/95 p-4 sm:p-10"
      onClick={onClose}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Foto diperbesar"
        className="w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-offwhite-muted">
            {index + 1} / {photos.length}
          </span>
          <button
            type="button"
            className="grid h-12 w-12 place-items-center border border-offwhite/25"
            aria-label="Tutup foto"
            onClick={onClose}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="relative h-[65svh] w-full">
          {photo.src && (
            <Image
              src={photo.src}
              alt={photo.alt || photo.title || "Foto CafeSite"}
              fill
              sizes="(min-width:1024px) 1000px, 100vw"
              unoptimized={!photo.src.startsWith("/Image/")}
              className="object-contain"
            />
          )}
        </div>
        {(photo.title || photo.caption || photo.year) && (
          <div className="mt-3 text-center">
            {photo.title && (
              <p className="font-serif text-lg text-offwhite">
                {photo.title}
                {photo.year ? ` · ${photo.year}` : ""}
              </p>
            )}
            {photo.caption && (
              <p className="mt-1 text-sm text-offwhite-muted">{photo.caption}</p>
            )}
          </div>
        )}
        <div className="mt-4 flex justify-between">
          <button
            className="grid h-12 w-12 place-items-center border border-offwhite/25"
            onClick={() =>
              onSelectPhoto(photos[(index - 1 + photos.length) % photos.length])
            }
            aria-label="Foto sebelumnya"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            className="grid h-12 w-12 place-items-center border border-offwhite/25"
            onClick={() => onSelectPhoto(photos[(index + 1) % photos.length])}
            aria-label="Foto berikutnya"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
