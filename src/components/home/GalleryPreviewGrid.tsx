"use client";

import { useEffect, useRef, useState } from "react";
import { GalleryPreviewFigure } from "./GalleryPreviewFigure";

interface GalleryPreviewItem {
  id: string;
  title: string;
  note: string;
  src?: string;
  className: string;
}

const galleryPreviewItems: GalleryPreviewItem[] = [
  {
    id: "g-01",
    title: "Meja Pojok Jendela",
    note: "Spot yang biasa diperebutkan pas sore",
    src: "/Image/Gallery/gal-01-window-table.jpg",
    className:
      "col-span-2 aspect-[4/3] sm:col-span-2 sm:aspect-[16/10] lg:col-span-2 lg:row-span-2 lg:h-full lg:aspect-auto",
  },
  {
    id: "g-02",
    title: "Latte Art di Balik Seduhan",
    note: "Tiap cangkir beda tembakannya",
    src: "/Image/Gallery/gal-02-morning-brew.jpg",
    className: "aspect-[4/3] sm:aspect-square lg:aspect-square",
  },
  {
    id: "g-03",
    title: "Semi-Outdoor Pas Sore",
    note: "Langit sebentar cerah, kopi masih panas",
    src: "/Image/Gallery/gal-03-after-rain.jpg",
    className: "aspect-[4/3] sm:aspect-square lg:aspect-square",
  },
  {
    id: "g-04",
    title: "Croissant dan Kopi",
    note: "Paduan yang jarang salah",
    src: "/Image/Gallery/gal-09-croissant.jpg",
    className:
      "col-span-2 aspect-[4/3] sm:col-span-2 sm:aspect-[16/10] lg:col-span-2 lg:aspect-[16/10]",
  },
];

/**
 * GalleryPreviewGrid — Collage Galeri Interaktif (Client Component)
 * Klik/tap sebuah foto → caption foto itu muncul, caption lain disembunyikan.
 * Klik foto yang sama lagi → caption ikutnya kehilang (toggle). Semua caption
 * turun kembali begitu grid keluar dari viewport (IntersectionObserver).
 */
export function GalleryPreviewGrid() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) setActiveId(null);
      },
      { threshold: 0.15 },
    );

    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={gridRef}
      className="m-rail m-rail--uniform grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-2 lg:grid-cols-4 lg:gap-4"
    >
      {galleryPreviewItems.map((item) => (
        <GalleryPreviewFigure
          key={item.id}
          {...item}
          isActive={activeId === item.id}
          onToggle={() =>
            setActiveId((current) => (current === item.id ? null : item.id))
          }
        />
      ))}
    </div>
  );
}