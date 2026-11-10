import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

const photos = [
  {
    src: "/Image/Gallery/gal-01-window-table.jpg",
    alt: "Meja pojok dekat jendela dengan cahaya sore alami",
    label: "Meja Jendela",
    desc: "Sudut favorit untuk membaca atau bekerja dengan cahaya alami.",
  },
  {
    src: "/Image/Gallery/gal-10-meja-komunal.jpg",
    alt: "Meja komunal kayu solid lapang dengan colokan listrik",
    label: "Meja Komunal",
    desc: "Dirancang cukup luas untuk laptop, catatan, dan diskusi santai.",
  },
  {
    src: "/Image/Gallery/gal-02-morning-brew.jpg",
    alt: "Barista sedang menyeduh kopi manual brew V60 dengan presisi",
    label: "Bar Seduh Manual",
    desc: "Single origin Nusantara diseduh pelan dengan takaran terjaga.",
  },
];

/**
 * GalleryStrip Component (Server Component)
 * Menampilkan preview 3 foto suasana dokumenter cafe.
 * Mengikuti prinsip design-taste-frontend: real photographs, quiet micro-interactions, no slop.
 */
export function GalleryStrip(): React.JSX.Element {
  return (
    <section
      id="galeri-suasana"
      aria-labelledby="gallery-strip-heading"
      className="border-b border-offwhite/10 bg-charcoal py-16 md:py-24"
    >
      <Container>
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-terracotta">
              Sudut Kedai
            </p>
            <h2
              id="gallery-strip-heading"
              className="mt-2 font-serif text-3xl font-normal text-offwhite sm:text-4xl"
            >
              Sudut Ruang untuk Bernapas
            </h2>
            <p className="mt-2 text-sm text-offwhite-muted sm:text-base">
              Sekilas sebelum kamu datang. Meja pojok jendela itu yang paling sering diperebutkan saat sore.
            </p>
          </div>
          <Link
            href="/gallery"
            className="link inline-flex items-center text-sm font-medium text-offwhite-muted hover:text-offwhite underline underline-offset-4"
          >
            Lihat semua foto ↗
          </Link>
        </div>

        {/* 3-Photo Grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, idx) => (
            <Link
              href="/gallery"
              key={idx}
              className="taste-card group flex flex-col overflow-hidden rounded-xl border border-offwhite/10 bg-charcoal-light transition-all hover:border-offwhite/30"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-charcoal-darkest">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                  className="taste-image-zoom object-cover"
                />
              </div>
              <div className="p-5">
                <p className="font-serif text-lg font-medium text-offwhite group-hover:text-terracotta-light transition-colors">
                  {photo.label}
                </p>
                <p className="mt-1 text-xs text-offwhite-muted leading-relaxed">
                  {photo.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

