import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { CafePhoto } from "./CafePhoto";
import { getMenuItems } from "@/lib/content";
import { menuCategories } from "@/data/menu";
import { formatPrice } from "@/lib/utils";
export async function MenuCollection(): Promise<React.JSX.Element> {
  const items = await getMenuItems();
  const ids = Array.from(
    new Set([
      ...menuCategories.map((category) => category.id),
      ...items.map((item) => item.category),
    ]),
  );
  const groups = ids
    .map((id) => ({
      id,
      name: menuCategories.find((category) => category.id === id)?.name ?? id,
      items: items.filter((item) => item.category === id),
    }))
    .filter((group) => group.items.length);
  return (
    <>
      <Container>
        <nav className="flex flex-wrap gap-3 pb-10" aria-label="Kategori menu">
          {groups.map((group) => (
            <a
              className="menu-anchor"
              key={group.id}
              href={`#menu-${group.id}`}
            >
              {group.name}
            </a>
          ))}
        </nav>
      </Container>
      {groups.map((group, index) => (
        <section
          key={group.id}
          className="public-menu-section"
          id={`menu-${group.id}`}
        >
          <Container>
            <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
              <div>
                <p className="section-label">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="public-h2 mt-3">{group.name}</h2>
                {group.items[0]?.image && (
                  <CafePhoto
                    src={group.items[0].image}
                    alt={group.items[0].name}
                    className="mt-8 aspect-[4/3]"
                    moment={index === 0}
                  />
                )}
              </div>
              <div>
                {group.items.map((item) => (
                  <article key={item.id} className="public-menu-row">
                    <div>
                      <h3 className="text-lg font-medium text-offwhite">{item.name}</h3>
                      <p className="mt-1.5 text-sm text-offwhite-muted leading-relaxed">{item.description}</p>
                      {item.isAvailable === false && (
                        <span className="mt-2 inline-block text-sm font-medium text-terracotta-light">
                          Sedang habis
                        </span>
                      )}
                    </div>
                    <span className="whitespace-nowrap text-base font-medium tabular-nums text-offwhite">
                      {formatPrice(item.price)}
                    </span>
                  </article>
                ))}
                <Link
                  className="link mt-6 inline-flex min-h-12 items-center"
                  href="/order"
                >
                  Pesan dari kategori ini ↗
                </Link>
              </div>
            </div>
          </Container>
        </section>
      ))}
      {groups.length === 0 && (
        <Container className="py-16">
          <p>Menu sedang diperbarui. Hubungi kami untuk pilihan hari ini.</p>
        </Container>
      )}
    </>
  );
}
