import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { GallerySection } from "@/components/gallery/GallerySection";
import { getPublicContent } from "@/lib/content";
import { uniqueGalleryPhotos } from "@/lib/gallery";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { cafe } = await getPublicContent();
  return createPageMetadata({
    title: `Galeri Suasana ${cafe.name}`,
    description: `Lihat foto ruang, kopi, dan makanan ${cafe.name} sebelum datang.`,
    path: "/gallery",
    keywords: ["galeri cafe", "interior cafe jakarta selatan", "suasana ngopi cipete"],
  });
}

export default async function GalleryPage(): Promise<React.JSX.Element> {
  const { cafe, gallery } = await getPublicContent();
  const photos = await uniqueGalleryPhotos(gallery);

  return (
    <>
      <PageIntro
        label={`Galeri ${cafe.name}`}
        title="Ruang & suasana kedai."
        description="Pilih kategori foto. Ketuk foto untuk melihat lebih dekat."
      />
      <GallerySection initialPhotos={photos} />
    </>
  );
}
