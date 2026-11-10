import Link from "next/link";
import { getPublicContent } from "@/lib/content";
import { buildWhatsAppUrl } from "@/lib/utils";
import { Container } from "@/components/ui/Container";

export async function Footer(): Promise<React.JSX.Element> {
  const { cafe } = await getPublicContent();
  return (
    <footer className="public-footer closing">
      <Container>
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-[2fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex min-h-11 items-center font-serif text-3xl tracking-tight">{cafe.name}<span className="text-terracotta-light">.</span></Link>
            <address className="mt-4 max-w-xs not-italic text-sm leading-relaxed text-offwhite-muted">{cafe.address}<br />{cafe.city}</address>
          </div>
          <nav aria-label="Halaman CafeSite" className="flex flex-col items-start">
            <Link className="nav-link" href="/menu">Menu</Link>
            <Link className="nav-link" href="/about">Tentang</Link>
            <Link className="nav-link" href="/gallery">Galeri</Link>
            <Link className="nav-link" href="/location">Lokasi</Link>
          </nav>
          <nav aria-label="Kontak dan pemesanan" className="flex flex-col items-start">
            <Link className="nav-link" href="/order" data-order-action>Pesan sekarang ↗</Link>
            <a className="nav-link" href={cafe.googleMapsUrl} target="_blank" rel="noopener noreferrer">Buka Maps ↗</a>
            {cafe.whatsapp && <a className="nav-link" href={buildWhatsAppUrl(cafe.whatsapp, "general")} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>}
            {cafe.instagramUrl && <a className="nav-link" href={cafe.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram ↗</a>}
          </nav>
        </div>
        <p className="mt-10 border-t border-offwhite/15 pt-5 text-sm text-offwhite-muted">© {new Date().getFullYear()} {cafe.name}</p>
      </Container>
    </footer>
  );
}
