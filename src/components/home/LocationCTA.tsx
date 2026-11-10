import { OpenNowBadge } from "@/components/layout/OpenNowBadge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ClockIcon, MapPinIcon } from "@/components/ui/icons";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { cafeInfo } from "@/data/cafe";
import { buildWhatsAppUrl, OpenStatusResult } from "@/lib/utils";

interface LocationCTAProps {
  initialStatus: OpenStatusResult;
}

/**
 * LocationCTA Section — Server Component
 * Panel datar (tanpa glow): alamat, jam hari ini, badge buka/tutup, dan 2 aksi.
 */
export function LocationCTA({ initialStatus }: LocationCTAProps) {
  const todaySchedule = initialStatus.todaySchedule;

  return (
    <section
      id="location-cta"
      aria-label="Lokasi dan Jam Operasional"
      className="border-t border-charcoal-border/30 bg-charcoal-darkest py-16 md:py-24"
    >
      <Container size="default">
        <div className="rounded-xl border border-charcoal-border/70 bg-charcoal-light/40 p-8 md:p-12">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            {/* Informasi */}
            <div className="lg:col-span-7">
              <div className="mb-4">
                <OpenNowBadge initialStatus={initialStatus} />
              </div>
              <h2 className="font-serif text-3xl font-medium tracking-tight text-offwhite sm:text-4xl">
                Mampir hari ini?
              </h2>
              <p className="mt-3 max-w-lg text-base leading-relaxed text-offwhite-muted">
                Nggak perlu alasan buat mampir. Pintunya emang sengaja dibuka,
                kopinya udah siap nyambut.
              </p>

              <div className="mt-8 space-y-4 border-t border-charcoal-border/40 pt-6">
                <div className="flex items-start gap-3 text-sm text-offwhite">
                  <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" />
                  <div>
                    <p className="font-medium text-offwhite">
                      {cafeInfo.address}, {cafeInfo.city}
                    </p>
                    {cafeInfo.landmark && (
                      <p className="mt-0.5 text-xs text-offwhite-muted">
                        {cafeInfo.landmark}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-offwhite">
                  <ClockIcon className="h-5 w-5 shrink-0 text-terracotta" />
                  <p className="text-offwhite">
                    <span className="font-medium">
                      {todaySchedule
                        ? `${todaySchedule.day}: ${todaySchedule.hours}`
                        : "Buka Setiap Hari: 08:00 – 22:00"}
                    </span>
                    {todaySchedule?.notes && (
                      <span className="ml-2 text-xs text-offwhite-muted">
                        ({todaySchedule.notes})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Aksi */}
            <div className="flex w-full flex-col gap-3.5 lg:col-span-5">
              <Button
                variant="solid"
                size="lg"
                href={buildWhatsAppUrl(cafeInfo.whatsapp, "reservation")}
                isExternal
                className="w-full"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span>Chat WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                href={cafeInfo.googleMapsUrl}
                isExternal
                className="w-full"
              >
                <MapPinIcon className="h-4 w-4 text-terracotta" />
                <span>Buka Google Maps</span>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}