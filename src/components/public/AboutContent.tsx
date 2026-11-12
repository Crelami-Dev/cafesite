import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CafePhoto } from "./CafePhoto";
import { AboutCraftShowcase } from "./AboutCraftShowcase";
import type { CafeInfo, GalleryPhoto } from "@/types";

const PILLARS = ["Single Origin Mingguan", "Seduhan Terukur", "3 Zona Duduk"] as const;

/** Halaman Tentang: Pembuka editorial ringkas (tanpa duplikasi hero) + Showcase slider prinsip kedai. */
export function AboutContent({
  cafe,
  area,
  configured,
  photos,
}: {
  cafe: CafeInfo;
  area: string;
  configured: boolean;
  photos?: GalleryPhoto[];
}): React.JSX.Element {
  const leadPhoto = photos?.[0] ?? {
    src: "/Image/Gallery/gal-01-window-table.jpg",
    alt: `Meja kayu di samping jendela ${cafe.name} dengan cangkir kopi dan cahaya siang`,
  };
  const insetPhoto = photos?.[2] ?? {
    src: "/Image/Gallery/gal-03-calm-corner.jpg",
    alt: `Sudut tenang ${cafe.name} dengan cangkir kopi di atas meja kayu`,
  };

  return (
    <>
      <section
        className="hero border-b border-offwhite/10 py-10 sm:py-14 lg:py-16"
        data-enter
        aria-labelledby="about-heading"
      >
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-10">
            {/* Kolom kiri: Judul langsung + narasi ringkas + fakta padat */}
            <div className="lg:col-span-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta-light">
                Tentang {cafe.name} · {area}
              </p>
              <h1 id="about-heading" className="public-h1 mt-3">
                Kopi yang nggak diburu.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-offwhite-muted sm:text-lg">
                {configured && cafe.tagline
                  ? `${cafe.tagline}. `
                  : ""}
                Banyak kafe ingin mejanya cepat kosong. Kami meracik kopi perlahan, memilih kursi yang
                nyaman, dan membiarkanmu duduk sampai sore tanpa tergesa.
              </p>

              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-offwhite-muted sm:text-sm">
                {PILLARS.map((pillar) => (
                  <li key={pillar} className="inline-flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-terracotta-light" aria-hidden="true" />
                    <span>{pillar}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button href="/menu" size="lg">
                  Lihat menu & harga
                </Button>
                <Link
                  className="inline-flex min-h-12 items-center rounded-md border border-offwhite/20 px-5 text-sm font-medium text-offwhite transition hover:border-offwhite/45 hover:bg-charcoal-light"
                  href="/gallery"
                >
                  Lihat galeri suasana
                </Link>
              </div>
            </div>

            {/* Kolom kanan: Kolase asimetris bersih 2 foto (ringkas di mobile, bertumpuk artistik di desktop/tablet) */}
            <div className="lg:col-span-6">
              <div className="grid grid-cols-12 items-end gap-3 sm:gap-4">
                <div className="col-span-8">
                  <CafePhoto
                    src={leadPhoto.src || "/Image/Gallery/gal-01-window-table.jpg"}
                    alt={leadPhoto.alt || `Suasana ${cafe.name}`}
                    className="aspect-[4/3] w-full rounded-lg lg:aspect-[4/5]"
                    sizes="(min-width: 1024px) 380px, 65vw"
                    priority
                    moment
                  />
                </div>
                <div className="col-span-4 pb-3 lg:pb-8">
                  <CafePhoto
                    src={insetPhoto.src || "/Image/Gallery/gal-03-calm-corner.jpg"}
                    alt={insetPhoto.alt || `Sudut meja tenang ${cafe.name}`}
                    className="aspect-[3/4] w-full rounded-lg"
                    sizes="(min-width: 1024px) 200px, 32vw"
                    reveal
                  />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <AboutCraftShowcase />
    </>
  );
}
