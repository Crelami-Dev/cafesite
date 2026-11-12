import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { getMenuItems } from "@/lib/content";
import { formatPrice } from "@/lib/utils";
import type { MenuItem } from "@/types";

/**
 * Menu favorit sebagai "papan menu": satu menu andalan tampil besar (foto, cerita, tombol pesan), di sampingnya
 * daftar menu lain seperti papan di kasir. Di mobile, nama dan harga disusun vertikal tanpa titik-titik.
 * Semua data dari menu di dashboard.
 */
export async function FeaturedMenu({
  items: propItems,
}: { items?: MenuItem[] } = {}): Promise<React.JSX.Element> {
  const menu = propItems ?? (await getMenuItems());
  const available = menu.filter((item) => item.isAvailable !== false);
  const ordered = [...available.filter((item) => item.isFeatured), ...available.filter((item) => !item.isFeatured)];
  const star = ordered.find((item) => item.tags?.includes("Best Seller") && item.image) ?? ordered.find((item) => item.image);
  const rest = ordered.filter((item) => item.id !== star?.id).slice(0, 7);

  return (
    <section id="menu-unggulan" aria-labelledby="featured-heading" className="board-section">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4" data-reveal>
          <h2 id="featured-heading" className="public-h2">
            Menu favorit dan harganya
          </h2>
          <Link href="/menu" className="link inline-flex min-h-11 items-center text-base">
            Lihat semua menu <span className="ml-2" aria-hidden="true">↗</span>
          </Link>
        </div>

        {available.length === 0 ? (
          <p className="mt-8">Menu sedang diperbarui.</p>
        ) : (
          <div className="board-grid">
            {star && (
              <article className="board-star" data-reveal>
                <Link href="/order" className="group block" aria-label={`Pesan ${star.name}`}>
                  <div className="m-zoom relative aspect-[4/3] overflow-hidden bg-charcoal lg:aspect-[4/5]">
                    <Image
                      src={star.image as string}
                      alt={star.name}
                      fill
                      unoptimized={!(star.image as string).startsWith("/Image/")}
                      sizes="(min-width: 1248px) 486px, (min-width: 1024px) 40vw, calc(100vw - 48px)"
                      className="object-cover"
                    />
                  </div>
                </Link>
                <p className="mt-4 text-sm font-medium text-terracotta-light lg:mt-6">Paling sering dipesan</p>
                <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 sm:flex-nowrap">
                  <h3 className="font-serif text-2xl leading-tight sm:text-3xl">{star.name}</h3>
                  <span className="shrink-0 text-lg font-medium tabular-nums">{formatPrice(star.price)}</span>
                </div>
                {star.description && <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-offwhite-muted sm:line-clamp-none sm:text-base">{star.description}</p>}
                <Button href="/order" size="lg" className="mt-5 w-full sm:w-auto lg:mt-6">
                  Pesan menu <span aria-hidden="true">↗</span>
                </Button>
              </article>
            )}

            <ul className="board-list" aria-label="Menu lainnya" data-reveal-group>
              {rest.map((item) => (
                <li key={item.id}>
                  <Link href="/order" className="board-row group" aria-label={`Pesan ${item.name}, ${formatPrice(item.price)}`}>
                    {item.image && (
                      <span className="m-zoom relative block h-14 w-14 shrink-0 overflow-hidden bg-charcoal sm:h-16 sm:w-16">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          unoptimized={!item.image.startsWith("/Image/")}
                          sizes="(min-width: 640px) 64px, 56px"
                          className="object-cover"
                        />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="board-row__line">
                        <span className="board-row__name">{item.name}</span>
                        <span className="board-row__dots" aria-hidden="true" />
                        <span className="board-row__price">{formatPrice(item.price)}</span>
                      </span>
                      {item.description && <span className="board-row__desc">{item.description}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}
