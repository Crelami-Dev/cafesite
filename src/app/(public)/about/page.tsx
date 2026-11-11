import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { AboutContent } from "@/components/public/AboutContent";
import { getPublicContent } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo";

function extractArea(address: string, city: string): string {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.find((part) => !/^jl\b|^jalan\b|\bno\b|\d/i.test(part)) ?? parts.at(-1) ?? city;
}

export async function generateMetadata(): Promise<Metadata> {
  const { cafe } = await getPublicContent();
  return createPageMetadata({
    title: `Tentang ${cafe.name}`,
    description: `Kenali kedai ${cafe.name}, lihat suasananya, dan cek informasi sebelum datang.`,
    path: "/about",
  });
}

export default async function AboutPage(): Promise<React.JSX.Element> {
  const { cafe, cafeConfirmed, gallery } = await getPublicContent();
  const area = extractArea(cafe.address, cafe.city);
  return (
    <>
      <PageIntro
        label={`Tentang ${cafe.name}`}
        title={`Kedai kopi ${cafe.name}.`}
        description={
          cafeConfirmed && cafe.tagline
            ? `${cafe.tagline} — berlokasi di ${area}.`
            : `Kedai kopi di ${area} untuk duduk lama: kopi single origin, makanan hangat, dan ruang yang tenang.`
        }
      />
      <AboutContent cafe={cafe} photos={gallery} />
    </>
  );
}
