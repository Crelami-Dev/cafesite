import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { CafePhoto } from "./CafePhoto";

export function AboutContent(): React.JSX.Element {
  return (
    <section className="pb-16 md:pb-24" aria-labelledby="about-space-heading">
      <Container>
        <CafePhoto src="/Image/Gallery/gal-01-window-table.jpg" alt="Meja dan area duduk di dekat jendela kedai" className="aspect-[4/3] md:aspect-[2/1]" sizes="(min-width: 1248px) 1200px, calc(100vw - 48px)" moment />
        <div className="grid gap-6 pt-10 md:pt-14 lg:grid-cols-2 lg:gap-16">
          <h2 id="about-space-heading" className="public-h2">Kopi, makanan,<br />dan tempat untuk duduk.</h2>
          <div className="max-w-md">
            <p className="text-base leading-relaxed text-offwhite-muted">Di CafeSite, kamu bisa melihat menu dan harga sebelum datang, atau pesan untuk makan di tempat maupun bawa pulang.</p>
            <p className="mt-4 text-base leading-relaxed text-offwhite-muted">Ingin tahu suasananya? Lihat foto kedai di galeri. Untuk jam operasional dan arah ke sini, buka halaman lokasi.</p>
            <div className="mt-5 flex flex-wrap gap-x-6">
              <Link className="link inline-flex min-h-12 items-center text-sm" href="/gallery">Lihat galeri ↗</Link>
              <Link className="link inline-flex min-h-12 items-center text-sm" href="/location">Lihat lokasi ↗</Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
