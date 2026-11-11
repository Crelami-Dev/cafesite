"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/ui/Container";
import { galleryPhotos } from "@/data/gallery";
import { GalleryCategory, GalleryPhoto } from "@/types";
import { GalleryFilterBar } from "./GalleryFilterBar";
import { GalleryGrid } from "./GalleryGrid";

interface GallerySectionProps {
  initialPhotos?: GalleryPhoto[];
}

/**
 * GallerySection — Client Component Orkestrator Filter & Grid
 * Menyimpan state kategori aktif murni dengan useState tanpa library eksternal.
 */
export function GallerySection({
  initialPhotos = galleryPhotos,
}: GallerySectionProps) {
  const [activeCategory, setActiveCategory] = useState<"all" | GalleryCategory>(
    "all",
  );
  const [hasFiltered, setHasFiltered] = useState(false);
  const selectCategory = (category: "all" | GalleryCategory): void => {
    setHasFiltered(true);
    setActiveCategory(category);
  };

  // Hitung jumlah item per kategori untuk badge filter
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: initialPhotos.length,
    };
    for (const photo of initialPhotos) {
      counts[photo.category] = (counts[photo.category] || 0) + 1;
    }
    return counts;
  }, [initialPhotos]);

  // Filter foto berdasarkan kategori yang dipilih
  const filteredPhotos = useMemo(() => {
    if (activeCategory === "all") return initialPhotos;
    return initialPhotos.filter((photo) => photo.category === activeCategory);
  }, [initialPhotos, activeCategory]);

  return (
    <>
      <GalleryFilterBar
        activeCategory={activeCategory}
        onSelectCategory={selectCategory}
        currentCount={filteredPhotos.length}
        categoryCounts={categoryCounts}
      />

      <section
        id="gallery-grid"
        aria-label="Koleksi Foto Galeri"
        className="py-12 md:py-16"
      >
        <Container size="default">
          {/* key agar caption reset ke hidden saat ganti kategori */}
          <GalleryGrid key={activeCategory} photos={filteredPhotos} animateIn={hasFiltered} />
        </Container>
      </section>
    </>
  );
}
