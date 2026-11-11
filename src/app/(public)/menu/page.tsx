import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { MenuCollection } from "@/components/public/MenuCollection";
import { MenuPicker } from "@/components/home/MenuPicker";
import { getPublicContent } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { cafe } = await getPublicContent();
  return createPageMetadata({
    title: `Menu Kopi, Minuman & Makanan ${cafe.name}`,
    description: `Lihat pilihan kopi, minuman, makanan, dan harga ${cafe.name}.`,
    path: "/menu",
    keywords: ["menu cafe", "kopi single origin", "pastry jakarta", "makanan cafe jakarta selatan"],
  });
}

export default async function MenuPage(): Promise<React.JSX.Element> {
  const { cafe, menu } = await getPublicContent();
  const items = menu.filter((item) => item.isAvailable !== false);
  return (
    <>
      <PageIntro
        label={`Menu ${cafe.name}`}
        title="Kopi, minuman & makanan."
        description="Pilih kategori, cek harga, lalu pesan untuk makan di tempat atau bawa pulang."
      />
      <MenuCollection />
      <MenuPicker items={items} />
    </>
  );
}
