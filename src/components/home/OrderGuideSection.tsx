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
    title: "Scan QR di meja",
    description:
      "Buka kamera HP, arahkan ke kode QR di sudut mejamu untuk membuka halaman pesan.",
  },
  {
    number: "02",
    title: "Pilih makanan & minuman",
    description:
      "Masukkan menu ke keranjang, tulis catatan bila perlu (misal: sedikit gula atau es terpisah).",
  },
  {
    number: "03",
    title: "Pantau nomor antrean",
    description:
      "Nomor antrean muncul di layar HP. Pesanan kami siapkan, bayar di kasir saat siap.",
  },
];

export function OrderGuideSection(): React.JSX.Element {
  return (
    <section
      id="cara-pesan"
      aria-labelledby="order-guide-heading"
      className="border-t border-offwhite/15 bg-charcoal-darkest py-14 md:py-24"
    >
      <Container>
        <div className="max-w-2xl">
          <h2 id="order-guide-heading" className="public-h2">
            Cara pesan dari <em className="italic">mejamu</em>.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-offwhite-muted">
            Duduk santai di meja pilihanmu tanpa perlu berdiri mengantre di
            depan kasir.
          </p>
        </div>

        <ol role="list" className="m-rail m-rail--sm mt-10 grid grid-cols-1 gap-8 md:mt-12 md:grid-cols-3 md:gap-10">
          {ORDER_STEPS.map((step) => (
            <li
              key={step.number}
              className="border-t border-offwhite/15 pt-5"
            >
              <span
                className="font-serif text-3xl text-terracotta-light tabular-nums"
                aria-hidden="true"
              >
                {step.number}
              </span>
              <h3 className="mt-3 text-lg font-medium text-offwhite">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-offwhite-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-offwhite/15 pt-8 sm:flex-row sm:items-center">
          <p className="text-sm leading-relaxed text-offwhite-muted">
            Mau dibawa pulang? Kamu tetap bisa memilih opsi{" "}
            <strong className="font-semibold text-offwhite">
              Bawa pulang (Takeaway)
            </strong>{" "}
            langsung di halaman pesan tanpa nomor meja.
          </p>
          <Link
            href="/order"
            className="link inline-flex min-h-11 shrink-0 items-center text-sm text-offwhite"
          >
            Buka halaman pesan <span className="ml-2" aria-hidden="true">↗</span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
