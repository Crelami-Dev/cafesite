import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { CafePhoto } from "@/components/public/CafePhoto";
import { Button } from "@/components/ui/Button";
import { WifiIcon, PlugIcon, LeafIcon, MosqueIcon } from "@/components/ui/icons";
import type { GalleryPhoto } from "@/types";

const FACILITIES = [
  { id: "wifi", icon: WifiIcon, title: "Wi-Fi kencang", text: "Cukup untuk meeting online dan kerja seharian.", shortTitle: "Wi-Fi kencang", shortText: "Aman untuk kerja." },
  { id: "plug", icon: PlugIcon, title: "Stopkontak di hampir tiap meja", text: "Meja indoor dan meja komunal, tanpa rebutan.", shortTitle: "Stopkontak banyak", shortText: "Tanpa rebutan." },
  { id: "outdoor", icon: LeafIcon, title: "Area semi-outdoor", text: "Beratap dan teduh; boleh merokok, anabul berkalung tali boleh ikut.", shortTitle: "Semi-outdoor", shortText: "Teduh, anabul boleh." },
  { id: "prayer", icon: MosqueIcon, title: "Musholla dan toilet bersih", text: "Sajadah, mukena, dan tempat wudhu tersedia.", shortTitle: "Musholla & toilet", shortText: "Bersih, ada mukena." },
] as const;

/**
 * Ruang kedai (komposisi story): teks dan fasilitas di kiri, grid bento 2 foto + kartu keterangan
 * di kanan yang sejajar tepi atas-bawah tanpa saling menutupi.
 */
export function PlaceSection({ photos = [] }: { photos?: GalleryPhoto[] } = {}): React.JSX.Element {
  const mainPhoto = photos[0];
  const sidePhoto = photos[1];
  const mainLabel = mainPhoto?.title || "Area Dalam & Meja Jendela";
  const sideLabel = sidePhoto?.title || "Bar Seduh & Meja Komunal";

  return (
    <section id="ruang" aria-labelledby="place-heading" className="home-section">
      <Container>
        <div className="story-split">
          <div className="flex flex-col justify-between">
            <div>
              <h2 id="place-heading" className="public-h2" data-reveal>
                Ruang untuk kerja, baca, dan ngobrol
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-offwhite-muted lg:mt-5 lg:text-lg" data-reveal>
                <span className="lg:hidden">Meja jendela untuk fokus, meja komunal untuk kerja bareng, teras untuk sore santai.</span>
                <span className="hidden lg:inline">
                  Meja jendela untuk yang mau tenang, meja komunal panjang untuk kerja bareng, dan sudut semi-outdoor untuk
                  sore yang santai.
                </span>
              </p>
              <ul
                className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5 border-y border-offwhite/15 py-5 lg:mt-8 lg:block lg:divide-y lg:divide-offwhite/15 lg:py-0"
                data-reveal-group
              >
                {FACILITIES.map(({ id, icon: Icon, title, text, shortTitle, shortText }) => (
                  <li key={id} className="flex flex-col items-start gap-2 lg:flex-row lg:gap-4 lg:py-4" data-draw>
                    <Icon className="h-5 w-5 shrink-0 text-terracotta-light lg:mt-1" />
                    <div>
                      <h3 className="text-[15px] font-medium leading-snug lg:text-base">
                        <span className="lg:hidden">{shortTitle}</span>
                        <span className="hidden lg:inline">{title}</span>
                      </h3>
                      <p className="mt-0.5 text-[13px] leading-snug text-offwhite-muted lg:mt-0 lg:text-base lg:leading-relaxed">
                        <span className="lg:hidden">{shortText}</span>
                        <span className="hidden lg:inline">{text}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6" data-reveal>
              <Button href="/order" size="lg">
                Pesan menu <span aria-hidden="true">↗</span>
              </Button>
              <Link href="/gallery" className="link inline-flex min-h-11 items-center text-base">
                Lihat foto suasana <span className="ml-2" aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="collage-bento">
            <Link
              href="/gallery"
              className="collage-bento__main group relative block overflow-hidden border border-offwhite/15 bg-charcoal-light"
              aria-label={`Lihat galeri: ${mainLabel}`}
              data-reveal
            >
              <CafePhoto
                src={mainPhoto?.src || "/Image/Gallery/gal-01-window-table.webp"}
                alt={mainPhoto?.alt || mainPhoto?.title || "Meja kayu di samping jendela dengan cangkir kopi dan cahaya siang"}
                className="m-zoom h-full w-full"
                sizes="(min-width: 1024px) 588px, (min-width: 640px) calc(100vw - 48px), calc((100vw - 60px) / 2)"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 border-t border-offwhite/15 bg-charcoal-darkest/85 px-4 py-2.5 text-xs text-offwhite">
                <span className="truncate font-medium">{mainLabel}</span>
                <span className="hidden shrink-0 text-offwhite-muted sm:inline">01 / Ruang</span>
              </div>
            </Link>

            <div className="collage-bento__row">
              <Link
                href="/gallery"
                className="collage-bento__sub group relative block overflow-hidden border border-offwhite/15 bg-charcoal-light"
                aria-label={`Lihat galeri: ${sideLabel}`}
              >
                <CafePhoto
                  src={sidePhoto?.src || "/Image/Gallery/gal-02-morning-brew.webp"}
                  alt={sidePhoto?.alt || sidePhoto?.title || "Barista menuang kopi hasil seduhan manual ke cangkir putih"}
                  className="m-zoom h-full w-full"
                  sizes="(min-width: 1024px) 320px, (min-width: 640px) 55vw, calc((100vw - 60px) / 2)"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 border-t border-offwhite/15 bg-charcoal-darkest/85 px-3.5 py-2 text-xs text-offwhite">
                  <span className="truncate font-medium">{sideLabel}</span>
                  <span className="hidden shrink-0 text-offwhite-muted sm:inline">02</span>
                </div>
              </Link>

              <div className="collage-bento__card flex flex-col justify-between border border-offwhite/15 bg-charcoal-light p-5" data-reveal>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-terracotta-light">
                    3 Zona Duduk
                  </p>
                  <p className="mt-2 font-serif text-xl leading-snug text-offwhite">
                    Tenang di dalam, santai di teras.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-offwhite-muted">
                    Pilih meja jendela untuk fokus sendiri, meja panjang untuk diskusi, atau area semi-outdoor.
                  </p>
                </div>
                <Link
                  href="/gallery"
                  className="link mt-4 inline-flex min-h-11 items-center text-sm font-medium text-offwhite hover:text-terracotta-light"
                >
                  Semua foto ({photos.length || 6}) <span className="ml-1.5" aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
