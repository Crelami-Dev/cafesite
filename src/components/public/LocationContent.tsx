import { getPublicContent } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CafePhoto } from "./CafePhoto";
import { OpenNowBadge } from "@/components/layout/OpenNowBadge";
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
                {cafe.city} {cafe.landmark ? `· Dekat ${cafe.landmark}` : ""}
              </address>
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
                  Chat WhatsApp ↗
                </Button>
              </div>

              <h2 className="mt-10 font-serif text-2xl text-offwhite">
                Jam Buka{!configured && " · contoh"}
              </h2>
              <dl className="mt-4">
                {cafe.openingHours.map((day) => (
                  <div
                    key={day.day}
                    className="flex justify-between gap-4 border-b border-offwhite/10 py-3 text-sm sm:text-base"
                  >
                    <dt className="text-offwhite font-medium">{day.day}</dt>
                    <dd className="text-offwhite-muted tabular-nums">
                      {day.hours}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <CafePhoto
              src="/Image/Gallery/gal-03-after-rain.jpg"
              alt="Fasad kedai dengan pintu masuk dan tanaman asri di CafeSite"
              className="min-h-80 aspect-[4/5] "
              moment
            />
          </div>
        </Container>
      </section>

      {/* Panduan Akses & Fasilitas */}
      <section className="border-t border-offwhite/10 bg-charcoal-darkest py-16 md:py-24">
        <Container>
          <p className="section-label">
            Panduan Kunjungan
          </p>
          <h2 className="public-h2 mt-2">Akses menuju kedai.</h2>
          
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {location.map((guide) => (
              <article
                key={guide.id}
                className="border-t border-offwhite/15 pt-5"
              >
                <h3 className="font-serif text-2xl text-offwhite">{guide.title}</h3>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-offwhite-muted">
                  {guide.description}
                </p>
              </article>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-16 border-t border-offwhite/10 pt-12">
            <h2 className="public-h2">Pertanyaan seputar kedai.</h2>
            <div className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2">
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
