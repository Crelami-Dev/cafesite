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

export function GallerySection({
  initialPhotos = galleryPhotos,
}: GallerySectionProps): React.JSX.Element {
  const [activeCategory, setActiveCategory] = useState<"all" | GalleryCategory>(
    "all",
  );
  const [hasFiltered, setHasFiltered] = useState(false);

  const selectCategory = (category: "all" | GalleryCategory): void => {
    setHasFiltered(true);
    setActiveCategory(category);
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: initialPhotos.length,
    };
    for (const photo of initialPhotos) {
      counts[photo.category] = (counts[photo.category] || 0) + 1;
    }
    return counts;
  }, [initialPhotos]);

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
        className="py-8 sm:py-10 lg:py-12"
      >
        <Container size="default">
          <GalleryGrid
            key={activeCategory}
            photos={filteredPhotos}
            animateIn={hasFiltered}
          />
        </Container>
      </section>
    </>
  );
}
