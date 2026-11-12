import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { GallerySection } from "@/components/gallery/GallerySection";
import { ArrowRightIcon } from "@/components/ui/icons";
import { getPublicContent } from "@/lib/content";
import { uniqueGalleryPhotos } from "@/lib/gallery";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { cafe } = await getPublicContent();
  return createPageMetadata({
    title: `Galeri Suasana ${cafe.name}`,
    description: `Lihat foto ruang, kopi, dan makanan ${cafe.name} sebelum datang.`,
    path: "/gallery",
    keywords: [
      "galeri cafe",
      "interior cafe jakarta selatan",
      "suasana ngopi cipete",
    ],
  });
}

export default async function GalleryPage(): Promise<React.JSX.Element> {
  const { cafe, gallery } = await getPublicContent();
  const photos = await uniqueGalleryPhotos(gallery);

  return (
    <>
      <header
        className="hero py-8 sm:py-12"
        data-enter
        aria-labelledby="gallery-heading"
      >
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta-light">
            Galeri {cafe.name}
          </p>
          <div className="mt-2.5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 id="gallery-heading" className="public-h1">
                Ruang &amp; suasana kedai.
              </h1>
              <p className="mt-2 max-w-lg text-sm text-offwhite-muted sm:text-base">
                Ketuk bingkai foto untuk melihat cerita dan detailnya secara penuh.
              </p>
            </div>
            <Link
              href="/order"
              className="btn btn--primary min-h-11 shrink-0 gap-2 text-sm"
            >
              <span>Pesan menu</span>
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </Container>
      </header>
      <GallerySection initialPhotos={photos} />
    </>
  );
}
