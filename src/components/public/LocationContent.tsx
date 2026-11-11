import { getPublicContent } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CafePhoto } from "./CafePhoto";
import { OpenNowBadge } from "@/components/layout/OpenNowBadge";
import { ParkingIcon, SignpostIcon, TransitIcon } from "@/components/ui/icons";
import { buildWhatsAppUrl, isOpenNow } from "@/lib/utils";

export async function LocationContent(): Promise<React.JSX.Element> {
  const {
    cafe,
    cafeConfirmed: configured,
    faq,
    location,
  } = await getPublicContent();

  return (
    <>
      <section className="pb-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <address className="font-serif text-3xl leading-snug not-italic text-offwhite sm:text-4xl">
                {cafe.address}
                <br />
                {cafe.city}
              </address>
              {cafe.landmark && (
                <p className="mt-3 text-lg leading-relaxed text-offwhite-muted">Patokan: {cafe.landmark}</p>
              )}
              {configured && (
                <div className="mt-5">
                  <OpenNowBadge
                    initialStatus={isOpenNow(cafe.openingHours)}
                    hours={cafe.openingHours}
                  />
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href={cafe.googleMapsUrl} isExternal variant="outline">
                  Buka Maps ↗
                </Button>
                <Button
                  href={buildWhatsAppUrl(cafe.whatsapp, "general")}
                  variant="outline"
                  isExternal
                  className="taste-btn-press"
                >
                  Chat WhatsApp ({cafe.whatsappFormatted}) ↗
                </Button>
                {cafe.instagramUrl && (
                  <Button href={cafe.instagramUrl} isExternal variant="outline">
                    Instagram {cafe.instagram} ↗
                  </Button>
                )}
              </div>

              <h2 className="mt-10 font-serif text-2xl text-offwhite">
                Jam Buka{!configured && " · contoh"}
              </h2>
              <dl className="mt-4" data-reveal-group>
                {cafe.openingHours.map((day) => (
                  <div
                    key={day.day}
                    className="flex justify-between gap-4 border-b border-offwhite/10 py-3 text-base"
                  >
                    <dt className="text-offwhite font-medium">{day.day}</dt>
                    <dd className="text-offwhite-muted tabular-nums">
                      {day.isOpen === false ? "Tutup" : day.hours}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {cafe.googleMapsEmbedUrl &&
            cafe.googleMapsEmbedUrl.startsWith("https://") &&
            !cafe.googleMapsEmbedUrl.includes("placeholder") ? (
              <div className="min-h-80 aspect-[4/5] w-full overflow-hidden border border-offwhite/15 bg-charcoal-light">
                <iframe
                  src={cafe.googleMapsEmbedUrl}
                  title={`Peta lokasi ${cafe.name}`}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            ) : (
              <CafePhoto
                src="/Image/hero/hero_authentic.jpg"
                alt={`Cangkir kopi susu dan buku catatan di meja kayu ${cafe.name}, tanaman hijau di belakang`}
                className="min-h-80 aspect-[4/5] "
                moment
              />
            )}
          </div>
        </Container>
      </section>

      {/* Panduan Akses & Fasilitas */}
      <section className="border-t border-offwhite/10 bg-charcoal-darkest py-16 md:py-24">
        <Container>
          <p className="section-label" data-reveal>
            Panduan Kunjungan
          </p>
          <h2 className="public-h2 mt-2" data-reveal>Akses menuju kedai.</h2>
          
          <div className="mt-10 grid gap-8 md:grid-cols-3" data-reveal-group>
            {location.map((guide) => {
              const GuideIcon =
                guide.icon === "parking"
                  ? ParkingIcon
                  : guide.icon === "transit"
                    ? TransitIcon
                    : SignpostIcon;
              return (
                <article
                  key={guide.id}
                  className="border-t border-offwhite/15 pt-5"
                >
                  <div className="flex items-center gap-2.5 text-terracotta-light">
                    <GuideIcon className="h-5 w-5 shrink-0" />
                    <h3 className="font-serif text-2xl text-offwhite">{guide.title}</h3>
                  </div>
                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-offwhite-muted">
                    {guide.description}
                  </p>
                  {guide.detail && (
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-offwhite-darker">
                      {guide.detail}
                    </p>
                  )}
                </article>
              );
            })}
          </div>

          {/* FAQ */}
          <div className="mt-16 border-t border-offwhite/10 pt-12">
            <h2 className="public-h2" data-reveal>Pertanyaan seputar kedai.</h2>
            <div className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2" data-reveal-group>
              {faq.map((item) => (
                <article
                  key={item.id}
                  className="border-t border-offwhite/10 pt-5"
                >
                  <h3 className="text-base sm:text-lg font-medium text-offwhite">{item.question}</h3>
                  <p className="mt-2 text-sm sm:text-base leading-relaxed text-offwhite-muted">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
