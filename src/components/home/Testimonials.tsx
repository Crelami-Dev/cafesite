"use client";

import { useRef } from "react";
import { Container } from "@/components/ui/Container";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon,
} from "@/components/ui/icons";
import type { Testimonial } from "@/types";

/**
 * Testimonials Section — Client Component
 * Carousel scroll-snap tanpa library: swipe native + tombol panah.
 */
export function Testimonials({
  testimonials,
}: { testimonials?: Testimonial[] } = {}): React.JSX.Element | null {
  const trackRef = useRef<HTMLDivElement | null>(null);

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  function scrollByDir(dir: number) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 16 : track.clientWidth * 0.8;
    track.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="border-b border-charcoal-border/30 bg-charcoal py-16 md:py-24"
    >
      <Container size="default">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between" data-reveal>
          <div>
            <h2 id="testimonials-heading" className="public-h2">
              Kata mereka yang <em className="italic font-serif">sering</em> mampir.
            </h2>
            <p className="mt-3.5 max-w-2xl text-sm leading-relaxed text-offwhite-muted md:text-base">
              Bukan dari kami, tapi dari yang tiap minggu mampir. Dengerin aja.
            </p>
          </div>
          <div className="hidden shrink-0 gap-3 lg:flex">
            <button
              type="button"
              onClick={() => scrollByDir(-1)}
              aria-label="Ulasan sebelumnya"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-charcoal-border/70 text-offwhite transition-colors hover:border-offwhite/60"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollByDir(1)}
              aria-label="Ulasan berikutnya"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-charcoal-border/70 text-offwhite transition-colors hover:border-offwhite/60"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          data-reveal
          aria-roledescription="carousel"
          aria-label="Kumpulan ulasan pengunjung"
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {testimonials.map((item) => (
            <figure
              key={item.id}
              data-card
              className="flex w-[85%] shrink-0 snap-start flex-col rounded-md border border-charcoal-border/50 bg-charcoal-light/50 p-6 sm:w-[calc((100%-16px)/2)] lg:w-[calc((100%-32px)/3)]"
            >
              <div className="flex items-center gap-2 text-terracotta-light">
                <StarIcon className="h-4 w-4" />
                <span className="text-xs font-medium text-offwhite">
                  {item.rating.toFixed(1)}
                </span>
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-offwhite/90 sm:text-base">
                &ldquo;{item.comment}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-baseline justify-between gap-3 border-t border-charcoal-border/30 pt-4 text-xs">
                <cite className="font-medium not-italic text-offwhite">
                  {item.name}
                </cite>
                <span className="text-offwhite-darker">{item.source}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}