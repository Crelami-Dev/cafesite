import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { CafePhoto } from "@/components/public/CafePhoto";

export function AboutPreview(): React.JSX.Element {
  return (
    <section id="tentang-ruang" aria-labelledby="about-preview-heading" className="marketing-section bg-charcoal">
      <Container>
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-16">
          <h2 id="about-preview-heading" className="public-h2 max-w-sm">Kenali kedainya<br />sebelum mampir.</h2>
          <div className="max-w-md">
            <p className="text-base leading-relaxed text-offwhite-muted">Dari area duduk sampai sudut bar. Lihat suasana CafeSite dan pilih tempat untuk ngopi nanti.</p>
            <Link href="/gallery" className="link mt-5 inline-flex min-h-11 items-center text-sm">Lihat galeri <span className="ml-3" aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-[1.4fr_1fr] md:gap-6">
          <CafePhoto src="/Image/Gallery/gal-01-window-table.webp" alt="Area duduk dekat jendela kedai" className="aspect-[4/3] md:aspect-auto md:min-h-96" sizes="(min-width: 1248px) 686px, (min-width: 768px) 58vw, calc(100vw - 48px)" />
          <Link href="/about" className="m-zoom relative block overflow-hidden" aria-label="Tentang CafeSite">
            <CafePhoto src="/Image/Gallery/gal-02-morning-brew.webp" alt="Proses menyeduh kopi di area bar" className="aspect-[4/3] md:aspect-[4/5]" sizes="(min-width: 1248px) 490px, (min-width: 768px) 42vw, calc(100vw - 48px)" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
