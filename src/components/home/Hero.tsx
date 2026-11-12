import Image from "next/image";
import { getPublicContent } from "@/lib/content";
import { formatPrice, isOpenNow } from "@/lib/utils";
import { OpenNowBadge } from "@/components/layout/OpenNowBadge";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { district } from "@/lib/address";

export async function Hero(): Promise<React.JSX.Element> {
  const { cafe, cafeConfirmed, menu } = await getPublicContent();
  const coffeePrices = menu.filter((item) => item.category === "coffee" && item.isAvailable !== false).map((item) => item.price);
  const cheapestCoffee = coffeePrices.length ? Math.min(...coffeePrices) : null;
  return (
    <section className="hero cafe-hero" data-enter aria-labelledby="hero-heading">
      {/* Foto penuh tanpa teks/overlay; kata-kata ada di bawahnya (mobile sampai desktop). */}
      <div className="cafe-hero__photo" data-enter-media>
        <Image
          src="/Image/hero/hero_authentic.webp"
          alt="Secangkir kopi di meja dekat jendela, dengan area duduk dan bar kedai di belakang"
          fill
          priority
          fetchPriority="high"
          loading="eager"
          sizes="100vw"
        />
      </div>

      <Container className="cafe-hero__body">
        <div className="cafe-hero__grid">
          <div>
            {cafeConfirmed ? (
              <div className="mb-4">
                <OpenNowBadge
                  initialStatus={isOpenNow(cafe.openingHours)}
                  hours={cafe.openingHours}
                />
              </div>
            ) : null}
            <h1 id="hero-heading" className="public-h1">
              Kedai kopi di {district(cafe.address)}, diseduh <em className="italic font-serif">pelan</em>.
            </h1>
          </div>
          <div className="max-w-md">
            <p className="text-base leading-relaxed text-offwhite-muted">
              {cafeConfirmed && cafe.tagline ? (
                <>
                  {cafe.tagline}{" "}
                  {cheapestCoffee ? `Kopi mulai ${formatPrice(cheapestCoffee)}.` : ""}{" "}
                </>
              ) : (
                <>
                  Kopi single origin{cheapestCoffee ? ` mulai ${formatPrice(cheapestCoffee)}` : ""}, makanan hangat, dan meja yang boleh kamu pakai lama.{" "}
                </>
              )}
              {cafeConfirmed && cafe.openingHours.every((day) => day.isOpen) && <span>Buka setiap hari.</span>}
            </p>
            <div className="cafe-hero__actions">
              <Button href="/order" size="lg">Pesan menu <span aria-hidden="true">↗</span></Button>
              <Button href="/menu" variant="outline" size="lg">Lihat menu & harga</Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
