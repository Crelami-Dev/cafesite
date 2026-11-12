import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CafePhoto } from "@/components/public/CafePhoto";
import { OpenNowBadge } from "@/components/layout/OpenNowBadge";
import { isOpenNow, buildWhatsAppUrl } from "@/lib/utils";
import type { VisitPanelProps } from "@/types";

/**
 * Blok lokasi dan jam buka (tepat di atas footer): panel alamat dan jam buka di kiri, peta Google Maps kedai
 * di kanan (foto ruangan bila link embed peta belum diisi). Jam yang belum dikonfirmasi pemilik ditandai data-assumed
 * dan tidak memunculkan status "buka sekarang".
 */
export function VisitPanel({ cafe, configured }: VisitPanelProps): React.JSX.Element {
  return (
    <section id="kunjungan" aria-labelledby="visit-heading" className="visit-section">
      <Container>
        <h2 id="visit-heading" className="public-h2" data-reveal>
          Lokasi dan jam buka
        </h2>

        <div className="visit-split" data-reveal-group>
          <div className="visit-panel">
            {configured && (
              <OpenNowBadge initialStatus={isOpenNow(cafe.openingHours)} hours={cafe.openingHours} />
            )}
            <div className="visit-panel__cols">
              <div>
                <address className="not-italic text-lg leading-relaxed">
                  {cafe.address}
                  <br />
                  {cafe.city}
                </address>
                {cafe.landmark && (
                  <p className="mt-3 text-base leading-relaxed text-offwhite-muted">{cafe.landmark}</p>
                )}
                <div className="mt-6 flex flex-col items-start gap-2">
                  <Button href={cafe.googleMapsUrl} variant="outline" size="md" isExternal>
                    Petunjuk arah <span aria-hidden="true">↗</span>
                  </Button>
                  {cafe.whatsapp && (
                    <div className="flex flex-col items-start gap-1">
                      <a
                        className="link inline-flex min-h-11 items-center text-base"
                        href={buildWhatsAppUrl(cafe.whatsapp, "general")}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Tanya info via WhatsApp <span className="ml-2" aria-hidden="true">↗</span>
                      </a>
                      <span className="text-xs text-offwhite-muted">
                        *Pertanyaan umum & lokasi (pesan menu via WhatsApp segera hadir)
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <dl data-assumed={!configured || undefined} className="visit-hours">
                  {cafe.openingHours.map((hours) => (
                    <div key={hours.day}>
                      <dt>{hours.day}</dt>
                      <dd>{hours.isOpen ? hours.hours.replace(/\s*–\s*/, "–") : "Tutup"}</dd>
                    </div>
                  ))}
                </dl>
                {!configured && (
                  <p className="mt-3 text-sm text-offwhite-muted">Jam masih perkiraan. Pastikan lewat WhatsApp sebelum datang.</p>
                )}
              </div>
            </div>
          </div>
          {cafe.googleMapsEmbedUrl ? (
            <div className="visit-map">
              <iframe
                src={cafe.googleMapsEmbedUrl}
                title={`Peta lokasi ${cafe.name} di Google Maps`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          ) : (
            <CafePhoto
              src="/Image/Gallery/gal-06-lampu-bar.webp"
              alt="Ruang dalam CafeSite yang terang: tamu membaca di kursi kayu dekat jendela besar"
              className="visit-photo"
              sizes="(min-width: 1024px) 588px, 100vw"
            />
          )}
        </div>
      </Container>
    </section>
  );
}
