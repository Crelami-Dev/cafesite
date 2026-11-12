import { Container } from "@/components/ui/Container";
import { ProgressiveImage } from "@/components/ui/ProgressiveImage";
import { MenuItemRow } from "@/components/menu/MenuItemRow";
import { ImageIcon } from "@/components/ui/icons";
import { menuItems, type MenuCategoryMeta } from "@/data/menu";

interface MenuCategorySectionProps {
  category: MenuCategoryMeta;
  index: number;
}

/**
 * MenuCategorySection — Bagian Kategori Menu (Server Component)
 * Daftar menu tipografis 2 kolom di `lg+`, dengan area foto kategori yang
 * diselang-seling kiri/kanan antar kategori. Foto hanya tampil di layar
 * besar (desktop & tablet landscape); di bawah `lg` (mobile & tablet
 * potrait) area foto disembunyikan agar daftar tetap ringkas.
 */
export function MenuCategorySection({
  category,
  index,
}: MenuCategorySectionProps) {
  const items = menuItems.filter((item) => item.category === category.id);
  const isEven = index % 2 === 0;
  const photoRight = index % 2 !== 0;
  const bgClass = isEven ? "bg-charcoal" : "bg-charcoal-darkest";
  const categoryImage = category.image || items.find((i) => i.image)?.image;

  const indexedItems = items.map((item, itemIndex) => ({ item, itemIndex }));
  const midPoint = Math.ceil(indexedItems.length / 2);
  const leftCol = indexedItems.slice(0, midPoint);
  const rightCol = indexedItems.slice(midPoint);

  return (
    <section
      id={category.id}
      aria-label={category.name}
      className={`scroll-mt-32 md:scroll-mt-36 border-b border-charcoal-border/30 py-14 md:py-20 ${bgClass}`}
    >
      <Container size="default">
        {/* Header Kategori */}
        <header className="mb-8 md:mb-10">
          <span className="mb-2 block text-xs font-medium uppercase tracking-widest text-terracotta">
            Kategori
          </span>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-offwhite sm:text-3xl">
            {category.name}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-offwhite-muted">
            {category.description}
          </p>
        </header>

        <div className="lg:grid lg:grid-cols-12 lg:gap-14">
          {/* Area Foto Kategori (hanya lg+) */}
          <figure
            aria-hidden="true"
            className={`relative hidden overflow-hidden rounded-md border border-charcoal-border/50 bg-charcoal-lighter lg:col-span-4 lg:flex lg:min-h-[340px] ${
              photoRight ? "lg:order-2" : ""
            }`}
          >
            {categoryImage ? (
              <ProgressiveImage
                src={categoryImage}
                alt={category.name}
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="object-cover"
              />
            ) : (
              <ImageIcon className="h-10 w-10 text-charcoal-muted" />
            )}
          </figure>

          {/* Daftar Menu */}
          <div
            className={`grid grid-cols-1 gap-x-12 lg:col-span-8 lg:grid-cols-2 lg:gap-x-16 ${
              photoRight ? "lg:order-1" : ""
            }`}
          >
            <div className="flex flex-col">
              {leftCol.map(({ item, itemIndex }) => (
                <MenuItemRow key={item.id} item={item} index={itemIndex} />
              ))}
            </div>
            <div className="flex flex-col">
              {rightCol.map(({ item, itemIndex }) => (
                <MenuItemRow key={item.id} item={item} index={itemIndex} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}