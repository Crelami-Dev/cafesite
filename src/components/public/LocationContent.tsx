import { getPublicContent } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CafePhoto } from "./CafePhoto";
import { OpenNowBadge } from "@/components/layout/OpenNowBadge";
import { LocationInteractiveGuides } from "./LocationInteractiveGuides";
import { MapPinIcon } from "@/components/ui/icons";
import { buildWhatsAppUrl, isOpenNow } from "@/lib/utils";

export async function LocationContent(): Promise<React.JSX.Element> {
  const {
    cafe,
    cafeConfirmed: configured,
    faq,
    location,
  } = await getPublicContent();

  const embedUrl = cafe.googleMapsEmbedUrl ?? "";
  const hasValidEmbed =
    embedUrl.startsWith("https://") && !embedUrl.includes("placeholder");

  return (
    <>
      <section
        className="hero border-b border-offwhite/10 py-8 sm:py-12 lg:py-16"
        data-enter
        aria-labelledby="location-heading"
      >
        <Container>
          <div className="grid items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Kolom kiri: Alamat, status buka, tombol aksi bersih, dan jam buka 2 kolom ringkas */}
            <div className="flex flex-col justify-between lg:col-span-6">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta-light">
                    Lokasi {cafe.name}
                  </span>
                  {configured && (
                    <OpenNowBadge
                      initialStatus={isOpenNow(cafe.openingHours)}
                      hours={cafe.openingHours}
                    />
                  )}
                </div>

                <h1 id="location-heading" className="public-h1 mt-3">
                  <address className="not-italic">
                    {cafe.address}
                    <span className="mt-1 block text-2xl text-offwhite-muted sm:text-3xl">
                      {cafe.city}
                    </span>
                  </address>
                </h1>

                {cafe.landmark && (
                  <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-offwhite-muted sm:text-base">
                    <MapPinIcon className="mt-0.5 size-4 shrink-0 text-terracotta-light" />
                    <span>Patokan: {cafe.landmark}</span>
                  </p>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Button
                    href={cafe.googleMapsUrl}
                    isExternal
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    Buka Google Maps ↗
                  </Button>
                  <Button
                    href={buildWhatsAppUrl(cafe.whatsapp, "general")}
                    variant="outline"
                    size="lg"
                    isExternal
                    className="taste-btn-press w-full sm:w-auto"
                  >
                    Tanya via WhatsApp ↗
                  </Button>
                  {cafe.instagramUrl && (
                    <a
                      href={cafe.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center justify-center px-3 text-sm text-offwhite-muted underline underline-offset-4 transition hover:text-offwhite sm:justify-start"
                    >
                      Instagram {cafe.instagram} ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Jam operasional: 2 kolom ringkas pada layar lebar & rapi tanpa memakan tempat di mobile */}
              <div className="mt-8 border-t border-offwhite/12 pt-6">
                <h2 className="font-serif text-xl text-offwhite">
                  Jam operasional{!configured && " · contoh"}
                </h2>
                <dl
                  className="mt-3 grid gap-x-8 gap-y-1 sm:grid-cols-2"
                  data-reveal-group
                >
                  {cafe.openingHours.map((day) => (
                    <div
                      key={day.day}
                      className="flex justify-between gap-4 border-b border-offwhite/10 py-2.5 text-sm"
                    >
                      <dt className="font-medium text-offwhite">{day.day}</dt>
                      <dd className="tabular-nums text-offwhite-muted">
                        {day.isOpen === false ? "Tutup" : day.hours}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Kolom kanan: Bingkai Peta tanpa filter CSS pada iframe agar tile Google Maps selalu tampil tajam */}
            <div className="lg:col-span-6">
              {hasValidEmbed ? (
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-none border border-offwhite/15 bg-charcoal-light lg:h-full lg:min-h-[460px] lg:aspect-auto">
                  <div
                    className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-xs text-offwhite-muted"
                    aria-hidden="true"
                  >
                    <MapPinIcon className="size-5 text-terracotta-light" />
                    <span>{cafe.address}, {cafe.city}</span>
                  </div>
                  <iframe
                    src={embedUrl}
                    loading="lazy"
                    title={`Peta lokasi ${cafe.name}`}
                    className="relative z-10 h-full w-full border-0"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                  <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-offwhite/20 bg-charcoal/90 px-3 py-1 text-xs font-medium text-offwhite shadow-floating backdrop-blur-sm">
                      <MapPinIcon className="size-3.5 text-terracotta-light" />
                      <span>{cafe.city}</span>
                    </span>
                  </div>
                </div>
              ) : (
                <CafePhoto
                  src="/Image/hero/hero_authentic.webp"
                  alt={`Cangkir kopi susu dan buku catatan di meja kayu ${cafe.name}`}
                  className="aspect-[4/3] w-full rounded-none lg:h-full lg:min-h-[460px] lg:aspect-auto"
                  moment
                />
              )}
            </div>
          </div>
        </Container>
      </section>

      <LocationInteractiveGuides location={location} faq={faq} />
    </>
  );
}
