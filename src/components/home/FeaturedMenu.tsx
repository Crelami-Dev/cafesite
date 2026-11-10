import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getMenuItems } from "@/lib/content";
import { formatPrice } from "@/lib/utils";
import type { MenuItem } from "@/types";

export async function FeaturedMenu({
  items: propItems,
}: { items?: MenuItem[] } = {}): Promise<React.JSX.Element> {
  const menu = propItems ?? (await getMenuItems());
  const available = menu.filter((item) => item.isAvailable !== false);
  const featured = available.filter((item) => item.isFeatured);
  const nonFeatured = available.filter((item) => !item.isFeatured);
  const items = [...featured, ...nonFeatured].slice(0, 6);
  return (
    <section id="menu-unggulan" aria-labelledby="featured-heading" className="bg-offwhite py-14 text-charcoal md:py-24">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="featured-heading" className="public-h2">Pilihan dari menu kami.</h2>
          <Link href="/menu" className="link inline-flex min-h-11 items-center text-sm">Lihat semua menu <span className="ml-3" aria-hidden="true">↗</span></Link>
        </div>
        <div className="m-rail mt-8 grid gap-6 md:mt-10 md:grid-cols-3">
          {items.map((item) => (
            <Link
              href="/order"
              key={item.id}
              className="group flex min-h-11 min-w-0 flex-col border-b border-charcoal/20 pb-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              aria-label={`Pesan ${item.name}, ${formatPrice(item.price)}`}
            >
              {item.image && (
                <div className="m-zoom relative aspect-[4/3] overflow-hidden bg-charcoal/10">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(min-width: 1248px) 384px, (min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <h3 className="text-lg font-medium leading-snug">{item.name}</h3>
                <span className="shrink-0 text-base font-medium tabular-nums">{formatPrice(item.price)}</span>
              </div>
              {item.description && (
                <p className="mt-1 line-clamp-2 text-sm text-charcoal/75">
                  {item.description}
                </p>
              )}
            </Link>
          ))}
        </div>
        {!items.length && <p className="mt-8">Menu sedang diperbarui.</p>}
      </Container>
    </section>
  );
}
