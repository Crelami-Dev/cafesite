import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { GalleryPreviewGrid } from "./GalleryPreviewGrid";

/**
 * GalleryPreview Section — Server Component
 * Layout: mobile & tablet potrait collage 2 kolom (hero lebar penuh di atas &
 * bawah, dua tile sedang di tengah), desktop bento 4 kolom. Interaksi
 * (caption muncul saat foto diklik) dipegang penuh oleh GalleryPreviewGrid.
 */
export function GalleryPreview(): React.JSX.Element {
  return (
    <section
      id="gallery-preview"
      aria-labelledby="gallery-preview-heading"
      className="border-b border-charcoal-border/30 bg-charcoal-darkest py-16 md:py-24"
    >
      <Container size="default">
        <div className="mb-8 md:mb-12">
          <h2 id="gallery-preview-heading" className="public-h2">
            Sekilas suasana <em className="italic font-serif">kedai</em> kami.
          </h2>
          <p className="mt-3.5 max-w-2xl text-sm leading-relaxed text-offwhite-muted md:text-base">
            Lihat sudut ruang sebelum mampir. Meja dekat jendela biasanya paling cepat terisi saat sore.
          </p>
        </div>

        <GalleryPreviewGrid />

        <div className="mt-10 flex justify-center md:justify-start">
          <Button variant="outline" size="lg" href="/gallery">
            <span>Lihat Semua Foto</span>
            <ArrowRightIcon className="h-4 w-4 text-terracotta-light" />
          </Button>
        </div>
      </Container>
    </section>
  );
}