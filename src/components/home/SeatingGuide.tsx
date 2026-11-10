import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

interface SecondaryZone {
  id: string;
  title: string;
  description: string;
  image: string;
  alt: string;
}

const secondaryZones: SecondaryZone[] = [
  {
    id: "meja-komunal",
    title: "Meja Komunal",
    description:
      "Meja kayu panjang dengan akses stopkontak mudah, pas untuk kerja laptop atau diskusi kelompok kecil.",
    image: "/Image/Gallery/gal-10-meja-komunal.jpg",
    alt: "Meja komunal panjang berbahan kayu solid untuk kerja bersama di CafeSite",
  },
  {
    id: "sudut-tenang",
    title: "Sudut Tenang",
    description:
      "Sudut terlindung dengan pencahayaan hangat untuk fokus membaca, menulis catatan, atau menikmati waktu hening.",
    image: "/Image/Gallery/gal-04-quiet-corner.jpg",
    alt: "Sudut tenang dengan kursi nyaman dan pencahayaan hangat di CafeSite",
  },
  {
    id: "rak-bacaan",
    title: "Rak Bacaan & Bar",
    description:
      "Duduk santai di dekat aroma seduhan kopi sambil menikmati kurasi buku yang bebas dibaca di tempat.",
    image: "/Image/Gallery/gal-11-rak-bacaan.jpg",
    alt: "Rak buku kurasi bacaan dan area bar kopi di CafeSite",
  },
];

/**
 * SeatingGuide Component (Server Component)
 * Section 5 — Panduan memilih area duduk CafeSite dengan layout asimetris.
 */
export function SeatingGuide(): React.JSX.Element {
  return (
    <section
      id="panduan-ruang"
      aria-labelledby="seating-guide-heading"
      className="border-t border-offwhite/15 bg-charcoal-darkest py-14 md:py-24 text-offwhite"
    >
      <Container>
        <header className="mb-10 md:mb-14">
          <span className="inline-block text-xs font-medium uppercase tracking-widest text-terracotta mb-2.5">
            Panduan Ruang
          </span>
          <h2
            id="seating-guide-heading"
            className="font-serif text-3xl font-normal tracking-tight text-offwhite sm:text-4xl md:text-5xl leading-tight"
          >
            Mau duduk di <em className="italic font-serif">mana</em>?
          </h2>
          <p className="mt-3.5 max-w-2xl text-sm leading-relaxed text-offwhite-muted sm:text-base">
            Setiap sudut dirancang untuk ritme yang berbeda—entah untuk fokus membaca, menyelesaikan pekerjaan di laptop, atau mengobrol santai tanpa terburu-buru.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12 lg:items-start">
          {/* Kolom Kiri: Zona Utama (Meja Jendela) */}
          <article className="flex flex-col lg:col-span-7">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-charcoal-light">
              <Image
                src="/Image/Gallery/gal-01-window-table.jpg"
                alt="Meja dekat jendela dengan pencahayaan matahari alami di CafeSite"
                fill
                sizes="(min-width: 1200px) 680px, (min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="mt-5">
              <h3 className="font-serif text-2xl font-normal text-offwhite sm:text-3xl">
                Meja Jendela
              </h3>
              <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-offwhite-muted sm:text-base">
                Menghadap langsung ke arah luar dengan limpahan cahaya matahari alami dari pagi hingga sore. Pilihan ideal untuk membaca buku, menyesap seduhan manual, atau berbincang santai berdua.
              </p>
            </div>
          </article>

          {/* Kolom Kanan: 3 Zona Bertingkat Bergaris Halus */}
          <div className="m-rail m-rail--sm flex flex-col divide-y divide-offwhite/15 border-t border-offwhite/15 pt-8 max-md:divide-y-0 lg:col-span-5 lg:border-t-0 lg:pt-0">
            {secondaryZones.map((zone) => (
              <article
                key={zone.id}
                className="flex gap-4 py-6 first:pt-0 last:pb-0 sm:gap-5 max-md:flex-col max-md:gap-3 max-md:py-0 max-md:first:pt-0"
              >
                <div className="relative aspect-[4/3] w-28 shrink-0 sm:w-36 max-md:w-full! overflow-hidden bg-charcoal-light">
                  <Image
                    src={zone.image}
                    alt={zone.alt}
                    fill
                    sizes="(min-width: 640px) 144px, 112px"
                    className="object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-col justify-center">
                  <h3 className="font-serif text-lg font-normal text-offwhite sm:text-xl">
                    {zone.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-offwhite-muted sm:text-sm">
                    {zone.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-offwhite/15 pt-6 md:mt-12">
          <Link
            href="/gallery"
            className="link inline-flex min-h-11 items-center text-sm text-offwhite-muted hover:text-offwhite"
          >
            Lihat foto galeri lainnya <span className="ml-2" aria-hidden="true">↗</span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
