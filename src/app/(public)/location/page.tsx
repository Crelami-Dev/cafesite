import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { LocationContent } from "@/components/public/LocationContent";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Lokasi, Jam Buka & Petunjuk Arah",
  description:
    "Temukan alamat, jam operasional, akses transportasi, dan kontak WhatsApp CafeSite. Buka petunjuk arah Google Maps atau hubungi kami.",
  path: "/location",
  keywords: ["lokasi cafe cipete", "jam buka cafe jakarta selatan", "rute cafe cilandak"],
});

export default function LocationPage(): React.JSX.Element {
  return (
    <>
      <PageIntro
        label="Lokasi CafeSite"
        title="Alamat & jam operasional."
        description="Cek jam operasional dan petunjuk arah sebelum berangkat."
      />
      <LocationContent />
    </>
  );
}
