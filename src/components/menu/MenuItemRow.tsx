import { ProgressiveImage } from "@/components/ui/ProgressiveImage";
import { formatPrice } from "@/lib/utils";
import { ImageIcon } from "@/components/ui/icons";
import type { MenuItem } from "@/types";

interface MenuItemRowProps {
  item: MenuItem;
  index: number;
  showImage?: boolean;
}

/**
 * MenuItemRow — Baris Menu Tipografis Restoran Klasik (Server Component)
 * Di bawah `lg`, tiap item mendapat foto kecil yang berselang-seling
 * kiri/kanan berdasarkan urutan, karena area foto kategori besar
 * disembunyikan di layar itu. Di `lg+`, foto per-item disembunyikan agar
 * tidak bersaing dengan foto kategori yang sudah tampil di sisi.
 * `showImage=false` mematikan foto sepenuhnya untuk konteks padat
 * seperti sheet ringkas, di mana foto akan merusak densitas baris.
 */
export function MenuItemRow({ item, index, showImage = true }: MenuItemRowProps) {
  const imageOnRight = index % 2 !== 0;

  return (
    <article className={`flex gap-4 border-b border-charcoal-border/20 py-4 last:border-b-0 ${showImage ? "lg:block lg:gap-0" : ""}`}>
      {/* Foto Item (hanya di bawah lg, berselang-seling kiri/kanan) */}
      {showImage && (
        <div
          className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-charcoal-border/50 bg-charcoal-lighter lg:hidden ${
            imageOnRight ? "order-2" : "order-1"
          }`}
        >
          {item.image ? (
            <ProgressiveImage src={item.image} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <span aria-hidden="true" className="grid h-full place-items-center">
              <ImageIcon className="h-6 w-6 text-charcoal-muted" />
            </span>
          )}
        </div>
      )}

      <div className={`min-w-0 flex-1 ${showImage ? (imageOnRight ? "order-1" : "order-2") : ""}`}>
        {/* Baris Nama & Harga dengan Dotted Leader */}
        <div className="flex items-baseline gap-2 sm:gap-3">
          <h3 className="shrink-0 font-serif text-base font-medium tracking-tight text-offwhite sm:text-lg">
            {item.name}
          </h3>
          <div
            className="mx-1 mb-1 flex-1 self-end border-b border-dotted border-charcoal-border/60 sm:mx-2"
            aria-hidden="true"
          />
          <span className="shrink-0 text-sm font-semibold text-latte sm:text-base">
            {formatPrice(item.price)}
          </span>
        </div>

        {/* Baris Keterangan & Tag Pilihan */}
        <div className="mt-1 text-sm leading-relaxed text-offwhite-muted">
          {item.tags?.[0] && (
            <span className="mr-2 inline-block text-[11px] font-medium uppercase tracking-wide text-terracotta">
              {item.tags[0]}
            </span>
          )}
          <span>{item.description}</span>
        </div>
      </div>
    </article>
  );
}
