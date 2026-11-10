import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { MenuCollection } from "@/components/public/MenuCollection";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Menu Kopi, Minuman & Makanan",
  description:
    "Lihat pilihan kopi, minuman, makanan, dan harga CafeSite.",
  path: "/menu",
  keywords: ["menu cafe", "kopi single origin", "pastry jakarta", "makanan cafe jakarta selatan"],
});

export default function MenuPage(): React.JSX.Element {
  return (
    <>
      <PageIntro
        label="Menu CafeSite"
        title="Kopi, minuman & makanan."
        description="Pilih kategori, cek harga, lalu pesan untuk makan di tempat atau bawa pulang."
      />
      <MenuCollection />
    </>
  );
}
