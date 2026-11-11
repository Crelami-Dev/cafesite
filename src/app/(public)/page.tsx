import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { FacilitiesBar } from "@/components/home/FacilitiesBar";
import { FeaturedMenu } from "@/components/home/FeaturedMenu";
import { MenuPicker } from "@/components/home/MenuPicker";
import { OrderGuideSection } from "@/components/home/OrderGuideSection";
import { PlaceSection } from "@/components/home/PlaceSection";
import { Testimonials } from "@/components/home/Testimonials";
import { HomeFaq } from "@/components/home/HomeFaq";
import { VisitPanel } from "@/components/public/VisitPanel";
import { getPublicContent } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { cafe } = await getPublicContent();
  return createPageMetadata({
    title: `Kopi & Makanan di ${cafe.name}`,
    description:
      cafe.tagline ||
      `Lihat menu dan harga ${cafe.name}, pesan untuk makan di tempat atau bawa pulang, serta cek lokasi dan jam operasional.`,
    path: "/",
    keywords: [
      "cafe enak Jakarta Selatan",
      "kafe nyaman",
      "tempat nongkrong enak",
      "single origin kopi",
      "work from cafe jakarta",
    ],
  });
}

/**
 * Beranda mengikuti alur pengunjung: apa yang dijual (menu), tempatnya (ruang), cara pesan, tanya jawab,
 * lalu lokasi dan jam buka tepat di atas footer.
 * Setiap foto hanya tampil sekali di halaman ini. Testimoni hanya muncul bila pemilik mengisinya di dashboard.
 */
export default async function HomePage(): Promise<React.JSX.Element> {
  const content = await getPublicContent();
  const availableMenuItems = content.menu.filter(
    (item) => item.isAvailable !== false,
  );
  return (
    <>
      <Hero />
      <FacilitiesBar />
      <FeaturedMenu items={content.menu} />
      <MenuPicker items={availableMenuItems} />
      <PlaceSection photos={content.gallery} />
      <OrderGuideSection />
      <Testimonials testimonials={content.testimonials} />
      <HomeFaq items={content.faq} />
      <VisitPanel cafe={content.cafe} configured={content.cafeConfirmed} />
    </>
  );
}
