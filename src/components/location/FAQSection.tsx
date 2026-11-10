import { Container } from "@/components/ui/Container";
import { ChevronDownIcon } from "@/components/ui/icons";
import { locationFaqs } from "@/data/location";

/**
 * FAQSection — Pertanyaan Lazim Terkait Fasilitas & Kunjungan (Server Component)
 * Menggunakan elemen semantik native HTML5 <details> dan <summary>.
 * Nol JavaScript, aksesibel secara default, ringan dan kompatibel di semua peramban.
 * Desain kartu accordion yang nyaman di mata pada mobile, tablet, maupun desktop.
 */
export function FAQSection() {
  return (
    <section
      id="faq"
      aria-label="Pertanyaan yang Sering Diajukan Seputar Kunjungan"
      className="bg-charcoal-darkest py-16 sm:py-20 lg:py-28"
    >
      <Container size="default">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-10 text-center sm:text-left">
            <span className="text-xs font-medium uppercase tracking-widest text-terracotta">
              Pertanyaan Lazim
            </span>
            <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-offwhite sm:text-3xl lg:text-4xl">
              Jawaban Singkat Sebelum Melangkah
            </h2>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-offwhite-muted">
              Biar nggak ragu waktu melangkah kemari, berikut beberapa hal yang
              paling sering ditanyakan pengunjung seputar fasilitas dan tata tertib.
            </p>
          </div>

          {/* Accordion Cards */}
          <div className="space-y-3">
            {locationFaqs.map((faq) => (
              <details
                key={faq.id}
                className="group rounded-md border border-charcoal-border/50 bg-charcoal-light/25 p-4 sm:p-5 text-left transition-all duration-200 open:border-terracotta/40 open:bg-charcoal-light/40 hover:border-charcoal-border"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-sm font-medium text-offwhite sm:text-base hover:text-terracotta-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta focus-visible:text-terracotta">
                  <span>{faq.question}</span>
                  <span className="shrink-0 text-offwhite-muted transition-transform duration-200 group-open:rotate-180">
                    <ChevronDownIcon className="h-4 w-4" />
                  </span>
                </summary>
                <div className="pt-3 pr-2 text-xs sm:text-sm leading-relaxed text-offwhite-muted border-t border-charcoal-border/30 mt-3">
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>

          {/* Catatan Penutup Bantuan */}
          <div className="mt-10 rounded-md border border-charcoal-border/40 bg-charcoal/50 p-5 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-offwhite-muted leading-relaxed">
              Punya pertanyaan lain yang belum terjawab di atas? Tanyakan
              langsung ke barista saat tiba atau chat kami lewat WhatsApp.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
