import Link from "next/link";
import { Container } from "@/components/ui/Container";

interface OrderStep {
  number: string;
  title: string;
  description: string;
}

const ORDER_STEPS: OrderStep[] = [
  {
    number: "01",
    title: "Buka halaman pesan",
    description: "Scan QR di meja atau QR Bawa pulang. Setiap pesanan baru perlu scan baru.",
  },
  {
    number: "02",
    title: "Pilih menu dan catatannya",
    description: "Kurang manis, es dipisah, susu oat: tulis di catatan tiap menu.",
  },
  {
    number: "03",
    title: "Bayar lalu tunggu kabar",
    description: "Bayar dahulu di kasir. Biarkan website aktif agar pengingat muncul saat pesanan siap diambil.",
  },
];

const TICKET_STEPS = ["Menunggu", "Diproses", "Siap", "Selesai"] as const;

/**
 * Cara memesan: tiga langkah di kiri, di kanan tiket nomor antrean seperti yang dilihat pelanggan di HP
 * setelah memesan (gambaran tampilan halaman status pesanan, bukan pesanan sungguhan).
 */
export function OrderGuideSection(): React.JSX.Element {
  return (
    <section id="cara-pesan" aria-labelledby="order-guide-heading" className="home-section bg-charcoal-darkest">
      <Container>
        <div className="ticket-split">
          <div>
            <h2 id="order-guide-heading" className="public-h2" data-reveal>
              Pesan dari meja, bayar di kasir
            </h2>
            <ol className="mt-10 space-y-7" data-reveal-group>
              {ORDER_STEPS.map((step) => (
                <li key={step.number} className="flex gap-5">
                  <span className="font-serif text-3xl leading-none text-terracotta-light tabular-nums" aria-hidden="true">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-lg font-medium">{step.title}</h3>
                    <p className="mt-1 text-base leading-relaxed text-offwhite-muted">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
              <Link href="/order" className="link inline-flex min-h-11 items-center text-base">
                Buka halaman pesan <span className="ml-2" aria-hidden="true">↗</span>
              </Link>
            </div>

            <div className="mt-8 rounded-lg border border-offwhite/15 bg-charcoal-light/40 p-4" data-reveal>
              <div className="flex items-center gap-2.5">
                <span className="rounded bg-terracotta/20 px-2 py-0.5 text-xs font-medium text-terracotta-light">
                  Segera Hadir
                </span>
                <p className="text-sm font-medium text-offwhite">Pesan via WhatsApp</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-offwhite-muted">
                Layanan pemesanan otomatis lewat asisten WhatsApp sedang disiapkan. Untuk saat ini, silakan pesan langsung melalui website (scan QR di meja) atau memesan di kasir.
              </p>
            </div>
          </div>

          <figure className="ticket" data-reveal="ticket" role="img" aria-label="Gambaran tiket nomor antrean di HP: nomor A-012, pesanan sedang diproses">
            <div className="ticket__head">
              <span className="font-serif text-xl">CafeSite.</span>
              <span className="text-sm text-offwhite-muted">Status pesanan</span>
            </div>
            <p className="ticket__queue">A-012</p>
            <p className="text-base text-offwhite-muted">Pesananmu sedang dibuat barista.</p>
            <ol className="ticket__steps" aria-hidden="true">
              {TICKET_STEPS.map((label, index) => (
                <li key={label} data-done={index <= 1 || undefined}>
                  {label}
                </li>
              ))}
            </ol>
            <div className="ticket__tear" aria-hidden="true" />
            <dl className="ticket__lines">
              <div><dt>1 × Caramel Macchiato</dt><dd>Rp 28.000</dd></div>
              <div><dt>1 × Butter Croissant</dt><dd>Rp 24.000</dd></div>
              <div className="ticket__total"><dt>Total · sudah dibayar</dt><dd>Rp 52.000</dd></div>
            </dl>
          </figure>
        </div>
      </Container>
    </section>
  );
}
