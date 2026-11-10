import React from "react";
import { Container } from "@/components/ui/Container";
import { faqItems } from "@/data/faq";
import type { FaqItem } from "@/types";

/**
 * HomeFaq Section — Server Component
 * Accordion native <details>/<summary> berdesain editorial 2 kolom (4/8 di desktop).
 */
export function HomeFaq({
  items = faqItems,
}: { items?: FaqItem[] } = {}): React.JSX.Element {
  return (
    <section
      id="tanya-jawab"
      aria-labelledby="faq-heading"
      className="border-t border-offwhite/15 bg-charcoal py-14 text-offwhite md:py-24"
    >
      <Container size="default">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="faq-heading" className="public-h2">
              Tanya jawab <em className="italic font-serif">singkat</em>.
            </h2>
            <p className="mt-3.5 text-sm leading-relaxed text-offwhite-muted md:text-base">
              Hal-hal praktis yang paling sering ditanyakan sebelum teman-teman mampir ke kedai.
            </p>
          </div>

          <div className="lg:col-span-8">
            {items.map((item) => (
              <details
                key={item.id}
                className="group border-b border-offwhite/15 first:border-t"
              >
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-base font-medium text-offwhite transition-colors hover:text-terracotta-light [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 font-serif text-xl text-terracotta-light transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="pb-5 pr-8 text-sm leading-relaxed text-offwhite-muted sm:text-base">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
