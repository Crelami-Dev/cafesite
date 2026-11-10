import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  ArtisanalBrewIcon,
  CoffeeBeanIcon,
  LampIcon,
  WifiIcon,
} from "@/components/ui/icons";

interface HighlightItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const highlightsData: HighlightItem[] = [
  {
    id: "beans",
    title: "Kopi Lokal Pilihan",
    description:
      "Single origin Nusantara yang kami sangrai sendiri. Rasa nggak perlu nebak-nebak.",
    icon: CoffeeBeanIcon,
  },
  {
    id: "space",
    title: "Nyaman buat Kerja",
    description:
      "Colokan deket meja dan kursi yang bikin betah. Kerjaan numpuk jadi nggak kerasa.",
    icon: LampIcon,
  },
  {
    id: "wifi",
    title: "Wi-Fi Nggak Banyak Drama",
    description:
      "Rapat online aman, deadline tetep dikejar tanpa takut putus.",
    icon: WifiIcon,
  },
  {
    id: "brew",
    title: "Seduh Manual",
    description:
      "V60 atau kopi susu, takaran kami jaga. Santai tapi nggak asal.",
    icon: ArtisanalBrewIcon,
  },
];

/**
 * Highlights Section — Server Component
 * Ringkas & flat: 2×2 di mobile, 4 kolom di desktop.
 * Tanpa kartu, tanpa lengkungan berlebihan — hanya ikon + hairline atas.
 */
export function Highlights() {
  return (
    <section
      id="highlights"
      aria-label="Keunggulan CafeSite"
      className="border-b border-charcoal-border/30 bg-charcoal-darkest py-14 md:py-20"
    >
      <Container size="default">
        <SectionHeading
          eyebrow="Kenapa ke sini?"
          title="Empat alasan simpel buat singgah"
          align="center"
        />

        <div className="grid grid-cols-2 gap-x-6 gap-y-7 md:gap-x-8 lg:grid-cols-4">
          {highlightsData.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="border-t border-charcoal-border/40 pt-4"
              >
                <Icon className="h-5 w-5 text-terracotta" />
                <h3 className="mt-2.5 text-[15px] font-medium leading-snug text-offwhite">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-offwhite-muted">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}