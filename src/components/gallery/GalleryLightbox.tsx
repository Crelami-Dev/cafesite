"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { animate } from "animejs";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
} from "@/components/ui/icons";
import { prefersReducedMotion } from "@/lib/motion";
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
  const frameRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const index = photo ? photos.findIndex((p) => p.id === photo.id) : -1;

  useEffect(() => {
    if (!photo) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();

    const key = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        onSelectPhoto(photos[(index - 1 + photos.length) % photos.length]);
      }
      if (e.key === "ArrowRight") {
        onSelectPhoto(photos[(index + 1) % photos.length]);
      }
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

  useEffect(() => {
    if (!photo || !frameRef.current || prefersReducedMotion()) return;
    animate(frameRef.current, {
      opacity: [0.35, 1],
      scale: [0.985, 1],
      duration: 300,
      ease: "outQuart",
    });
  }, [photo]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-charcoal-darkest/95 p-4 backdrop-blur-sm sm:p-10"
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
          <span className="text-sm tabular-nums text-offwhite-muted">
            {index + 1} / {photos.length}
          </span>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-md border border-offwhite/25 text-offwhite transition hover:border-offwhite/50 hover:bg-charcoal-light"
            aria-label="Tutup foto"
            onClick={onClose}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={frameRef}
          onTouchStart={(e) => {
            touchX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchX.current === null || photos.length <= 1) return;
            const dx =
              (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 40) {
              onSelectPhoto(
                photos[
                  (index + (dx < 0 ? 1 : -1) + photos.length) % photos.length
                ],
              );
            }
          }}
          className="relative h-[62svh] w-full"
        >
          {photo.src && (
            <Image
              key={photo.id}
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
          <div className="mt-4 text-center">
            {photo.title && (
              <p className="font-serif text-xl text-offwhite">
                {photo.title}
                {photo.year ? ` · ${photo.year}` : ""}
              </p>
            )}
            {photo.caption && (
              <p className="mx-auto mt-1 max-w-xl text-sm leading-relaxed text-offwhite-muted">
                {photo.caption}
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-between">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-md border border-offwhite/25 text-offwhite transition hover:border-offwhite/50 hover:bg-charcoal-light"
            onClick={() =>
              onSelectPhoto(photos[(index - 1 + photos.length) % photos.length])
            }
            aria-label="Foto sebelumnya"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-md border border-offwhite/25 text-offwhite transition hover:border-offwhite/50 hover:bg-charcoal-light"
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
