import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { GallerySection } from "@/components/gallery/GallerySection";
import { getPublicContent } from "@/lib/content";
import { uniqueGalleryPhotos } from "@/lib/gallery";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Galeri Suasana CafeSite",
  description:
    "Lihat foto ruang, kopi, dan makanan CafeSite sebelum datang.",
  path: "/gallery",
  keywords: ["galeri cafe", "interior cafe jakarta selatan", "suasana ngopi cipete"],
});

export default async function GalleryPage(): Promise<React.JSX.Element> {
  const { gallery } = await getPublicContent();
  const photos = await uniqueGalleryPhotos(gallery);

  return (
    <>
      <PageIntro
        label="Galeri CafeSite"
        title="Ruang & suasana kedai."
        description="Pilih kategori foto. Ketuk foto untuk melihat lebih dekat."
      />
      <GallerySection initialPhotos={photos} />
    </>
  );
}
