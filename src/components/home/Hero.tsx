import Image from "next/image";
import { getPublicContent } from "@/lib/content";
import { isOpenNow } from "@/lib/utils";
import { OpenNowBadge } from "@/components/layout/OpenNowBadge";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export async function Hero(): Promise<React.JSX.Element> {
  const { cafe, cafeConfirmed } = await getPublicContent();
  return (
    <section className="hero cafe-hero" data-enter aria-labelledby="hero-heading">
      {/* Foto penuh tanpa teks/overlay; kata-kata ada di bawahnya (mobile sampai desktop). */}
      <div className="cafe-hero__photo" data-enter-media>
        <Image
          src="/Image/hero/hero_authentic.jpg"
          alt="Secangkir kopi di meja dekat jendela, dengan area duduk dan bar kedai di belakang"
          fill
          priority
          sizes="100vw"
        />
      </div>

      <Container className="cafe-hero__body">
        <div className="cafe-hero__grid">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <p className="section-label">Kedai kopi · {cafe.city}</p>
              {cafeConfirmed ? (
                <OpenNowBadge
                  initialStatus={isOpenNow(cafe.openingHours)}
                  hours={cafe.openingHours}
                />
              ) : null}
            </div>
            <h1 id="hero-heading" className="public-h1">
              Kopi yang diseduh pelan, <em className="italic font-serif">ruang</em> buat harimu.
            </h1>
          </div>
          <div className="max-w-md">
            <p className="text-base leading-relaxed text-offwhite-muted">
              Lihat menu dan harga, pesan dari meja atau bawa pulang, lalu cek jam buka sebelum mampir.
            </p>
            <div className="cafe-hero__actions">
              <Button href="/order" size="lg">Pesan sekarang <span aria-hidden="true">↗</span></Button>
              <Button href="/menu" variant="outline" size="lg">Lihat menu</Button>
            </div>
            <p className="cafe-hero__facts">
              <span>{cafe.address}</span>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
