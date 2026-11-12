import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FeaturedMenuInteractive } from "./FeaturedMenuInteractive";
import { getMenuItems } from "@/lib/content";
import type { MenuItem } from "@/types";

/**
 * Menu favorit interaktif: pratinjau spotlight berdampingan dengan papan daftar harga.
 */
export async function FeaturedMenu({
  items: propItems,
}: { items?: MenuItem[] } = {}): Promise<React.JSX.Element> {
  const menu = propItems ?? (await getMenuItems());
  const available = menu.filter((item) => item.isAvailable !== false);
  const ordered = [
    ...available.filter((item) => item.isFeatured),
    ...available.filter((item) => !item.isFeatured),
  ];

  // Utamakan item Best Seller yang punya foto agar spotlight pertama langsung siap
  const starFirst =
    ordered.find((item) => item.tags?.includes("Best Seller") && item.image) ??
    ordered.find((item) => item.image) ??
    ordered[0];

  const sortedForShowcase = starFirst
    ? [starFirst, ...ordered.filter((item) => item.id !== starFirst.id)]
    : ordered;

  return (
    <section id="menu-unggulan" aria-labelledby="featured-heading" className="board-section">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4" data-reveal>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta-light">
              Pilihan Kedai
            </p>
            <h2 id="featured-heading" className="public-h2 mt-1">
              Menu favorit dan harganya
            </h2>
          </div>
          <Link href="/menu" className="link inline-flex min-h-11 items-center text-sm sm:text-base">
            Lihat semua menu <span className="ml-2" aria-hidden="true">↗</span>
          </Link>
        </div>

        <FeaturedMenuInteractive items={sortedForShowcase} />
      </Container>
    </section>
  );
}
