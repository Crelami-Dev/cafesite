import Link from "next/link";
import { getPublicContent } from "@/lib/content";
import { buildWhatsAppUrl } from "@/lib/utils";
import { Container } from "@/components/ui/Container";
import { InstagramIcon, MapPinIcon } from "@/components/ui/icons";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

const PAGES = [
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "Tentang" },
  { href: "/gallery", label: "Galeri" },
  { href: "/location", label: "Lokasi" },
] as const;

/**
 * Footer. Mobile: ringkas — logo + tombol ikon kontak sebaris, alamat satu baris, menu halaman 2x2.
 * ("Pesan menu" tidak diulang di mobile karena sudah ada tombol pesan yang menempel di bawah layar.)
 * Desktop: tiga kolom di grid 12 (merek, halaman, kontak).
 */
export async function Footer(): Promise<React.JSX.Element> {
  const { cafe } = await getPublicContent();
  const contacts = [
    { href: cafe.googleMapsUrl, label: "Buka Maps", icon: MapPinIcon },
    cafe.whatsapp ? { href: buildWhatsAppUrl(cafe.whatsapp, "general"), label: "WhatsApp", icon: WhatsAppIcon } : null,
    cafe.instagramUrl ? { href: cafe.instagramUrl, label: "Instagram", icon: InstagramIcon } : null,
  ].filter((contact): contact is NonNullable<typeof contact> => contact !== null && Boolean(contact.href));

  return (
    <footer className="public-footer closing">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-x-6">
          <div className="lg:col-span-6">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="inline-flex min-h-11 items-center font-serif text-3xl tracking-tight">
                {cafe.name}
                <span className="text-terracotta-light">.</span>
              </Link>
              {/* Kontak sebagai ikon: hanya di mobile */}
              <div className="flex gap-2 lg:hidden">
                {contacts.map(({ href, label, icon: Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="footer-icon">
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
            <address className="mt-3 not-italic text-sm leading-relaxed text-offwhite-muted lg:mt-4 lg:max-w-xs lg:text-base">
              {cafe.address}
              <span className="lg:hidden">, </span>
              <br className="max-lg:hidden" />
              {cafe.city}
            </address>
          </div>

          <nav aria-label="Halaman CafeSite" className="footer-pages lg:col-span-3">
            {PAGES.map((page) => (
              <Link key={page.href} className="nav-link" href={page.href}>
                {page.label}
              </Link>
            ))}
          </nav>

          <nav aria-label="Kontak dan pemesanan" className="hidden flex-col items-start lg:col-span-3 lg:flex">
            <Link className="nav-link" href="/order" data-order-action>
              Pesan menu ↗
            </Link>
            {contacts.map(({ href, label }) => (
              <a key={label} className="nav-link" href={href} target="_blank" rel="noopener noreferrer">
                {label} ↗
              </a>
            ))}
          </nav>
        </div>
        <p className="mt-8 border-t border-offwhite/15 pt-5 text-xs text-offwhite-muted lg:mt-10 lg:text-sm">
          © {new Date().getFullYear()} {cafe.name}
        </p>
      </Container>
    </footer>
  );
}
