import type { Metadata } from "next";
import { LocationContent } from "@/components/public/LocationContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublicContent } from "@/lib/content";
import { buildFaqJsonLd, createPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { cafe } = await getPublicContent();
  return createPageMetadata({
    title: `Lokasi, Jam Buka & Petunjuk Arah ${cafe.name}`,
    description: `Temukan alamat, jam operasional, akses transportasi, dan kontak WhatsApp ${cafe.name}. Buka petunjuk arah Google Maps atau hubungi kami.`,
    path: "/location",
    keywords: [
      "lokasi cafe cipete",
      "jam buka cafe jakarta selatan",
      "rute cafe cilandak",
    ],
  });
}

export default async function LocationPage(): Promise<React.JSX.Element> {
  const { faq } = await getPublicContent();
  return (
    <>
      {faq.length > 0 && <JsonLd data={buildFaqJsonLd(faq)} />}
      <LocationContent />
    </>
  );
}
