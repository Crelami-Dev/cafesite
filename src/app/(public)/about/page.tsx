import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { AboutContent } from "@/components/public/AboutContent";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Tentang CafeSite",
  description:
    "Kenali kedai CafeSite, lihat suasananya, dan cek informasi sebelum datang.",
  path: "/about",
});

export default function AboutPage(): React.JSX.Element {
  return (
    <>
      <PageIntro
        label="Tentang CafeSite"
        title="Kedai kopi CafeSite."
        description="Lihat ruangnya, cek menunya, lalu tentukan waktu untuk mampir."
      />
      <AboutContent />
    </>
  );
}
