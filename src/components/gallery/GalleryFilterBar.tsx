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
  const categories = galleryCategories.filter(
    (category) => (categoryCounts[category.id] ?? 0) > 0,
  );

  return (
    <nav
      aria-label="Filter galeri"
      className="sticky top-[var(--nav-h)] z-20 border-y border-offwhite/10 bg-charcoal/95 py-3 backdrop-blur-sm"
    >
      <Container>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
            {categories.map((category) => {
              const active = activeCategory === category.id;
              return (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => onSelectCategory(category.id)}
                  aria-pressed={active}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition sm:gap-2 sm:px-4 sm:text-sm ${
                    active
                      ? "border-terracotta bg-terracotta text-offwhite-pure"
                      : "border-offwhite/15 bg-charcoal-light/50 text-offwhite-muted hover:border-offwhite/35 hover:text-offwhite"
                  }`}
                >
                  <span>{category.name}</span>
                  <span
                    className={`tabular-nums text-[11px] ${
                      active ? "text-offwhite/85" : "text-offwhite-muted/70"
                    }`}
                  >
                    {categoryCounts[category.id] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="hidden shrink-0 text-xs tabular-nums text-offwhite-muted md:inline">
            {currentCount} bingkai
          </span>
        </div>
        <p className="sr-only" aria-live="polite">
          {currentCount} foto ditampilkan
        </p>
      </Container>
    </nav>
  );
}
