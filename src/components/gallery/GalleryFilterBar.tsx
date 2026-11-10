"use client";
import { Container } from "@/components/ui/Container";
import { galleryCategories } from "@/data/gallery";
import type { GalleryCategory } from "@/types";
interface Props {
  activeCategory: "all" | GalleryCategory;
  onSelectCategory: (category: "all" | GalleryCategory) => void;
  currentCount: number;
  categoryCounts: Record<string, number>;
}
export function GalleryFilterBar({
  activeCategory,
  onSelectCategory,
  currentCount,
  categoryCounts,
}: Props): React.JSX.Element {
  return (
    <nav aria-label="Filter galeri">
      <Container>
        <div className="flex flex-wrap items-center gap-3">
          {galleryCategories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              aria-pressed={activeCategory === category.id}
              className={`menu-anchor text-sm ${activeCategory === category.id ? "border-terracotta bg-terracotta text-offwhite" : "text-offwhite-muted hover:text-offwhite"}`}
            >
              {category.name}
              <span className="ml-2 text-xs">
                {categoryCounts[category.id] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          {currentCount} foto ditampilkan
        </p>
      </Container>
    </nav>
  );
}
