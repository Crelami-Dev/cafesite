import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { OrderGuideSection } from "@/components/home/OrderGuideSection";
import { FeaturedMenu } from "@/components/home/FeaturedMenu";
import { MenuPicker } from "@/components/home/MenuPicker";
import { SeatingGuide } from "@/components/home/SeatingGuide";
import { FacilitiesBar } from "@/components/home/FacilitiesBar";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { Testimonials } from "@/components/home/Testimonials";
import { HomeFaq } from "@/components/home/HomeFaq";
import { VisitPanel } from "@/components/public/VisitPanel";
import { faqItems } from "@/data/faq";
import { getPublicContent } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Kopi & Makanan di CafeSite",
  description:
    "Lihat menu dan harga CafeSite, pesan untuk makan di tempat atau bawa pulang, serta cek lokasi dan jam operasional.",
  path: "/",
  keywords: [
    "cafe enak Jakarta Selatan",
    "kafe nyaman",
    "tempat nongkrong enak",
    "single origin kopi",
    "work from cafe jakarta",
  ],
});

export default async function HomePage(): Promise<React.JSX.Element> {
  const content = await getPublicContent();
  const availableMenuItems = content.menu.filter(
    (item) => item.isAvailable !== false,
  );

  return (
    <>
      <Hero />
      <OrderGuideSection />
      <FeaturedMenu items={content.menu} />
      <MenuPicker items={availableMenuItems} />
      <SeatingGuide />
      <FacilitiesBar />
      <GalleryPreview />
      <Testimonials testimonials={content.testimonials} />
      <HomeFaq items={faqItems} />
      <VisitPanel cafe={content.cafe} configured={content.cafeConfirmed} />
    </>
  );
}
