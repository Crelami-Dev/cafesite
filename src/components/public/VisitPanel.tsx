import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { OpenNowBadge } from "@/components/layout/OpenNowBadge";
import { isOpenNow, buildWhatsAppUrl } from "@/lib/utils";
import type { VisitPanelProps } from "@/types";

/**
 * VisitPanel Component
 * Section 10 — Panel informasi jam operasional dan lokasi kedai berdesain editorial.
 */
export function VisitPanel({ cafe, configured }: VisitPanelProps): React.JSX.Element {
  return (
    <section
      id="kunjungan"
      aria-labelledby="visit-heading"
      className="border-t border-offwhite/15 bg-charcoal py-16 text-offwhite md:py-24"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
          <div>
            <span className="inline-block text-xs font-medium uppercase tracking-widest text-terracotta mb-2.5">
              Kunjungan
            </span>
            <h2 id="visit-heading" className="public-h2">
              Jam & lokasi <em className="italic font-serif">kedai</em>.
            </h2>
            <address className="mt-6 max-w-md not-italic text-base leading-relaxed text-offwhite-muted">
              <span className="block font-medium text-offwhite">{cafe.name}</span>
              <span>{cafe.address}</span>
              <br />
              <span>{cafe.city}</span>
              {cafe.landmark && (
                <span className="mt-2 block text-sm text-offwhite-muted/80">
                  Patokan: {cafe.landmark}
                </span>
              )}
            </address>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button href={cafe.googleMapsUrl} variant="outline" size="md" isExternal>
                Buka Maps <span aria-hidden="true">↗</span>
              </Button>
              {cafe.whatsapp && (
                <a
                  className="link inline-flex min-h-11 items-center text-sm font-medium text-offwhite transition-colors hover:text-terracotta-light"
                  href={buildWhatsAppUrl(cafe.whatsapp, "general")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chat WhatsApp <span className="ml-2" aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            {configured && (
              <div className="mb-6">
                <OpenNowBadge
                  initialStatus={isOpenNow(cafe.openingHours)}
                  hours={cafe.openingHours}
                />
              </div>
            )}
            <div className="border-t border-offwhite/15">
              <dl
                data-assumed={!configured || undefined}
                className="divide-y divide-offwhite/15"
              >
                {cafe.openingHours.map((hours) => (
                  <div
                    key={hours.day}
                    className="flex items-center justify-between gap-4 py-3.5 text-sm sm:text-base"
                  >
                    <dt className="text-offwhite-muted">{hours.day}</dt>
                    <dd className="text-right font-medium text-offwhite tabular-nums">
                      {hours.hours}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            {!configured && (
              <p className="mt-4 text-xs text-offwhite-muted/70">
                * Jadwal operasional di atas merupakan perkiraan jadwal standar kedai.
              </p>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
