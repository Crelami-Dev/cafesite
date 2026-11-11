import { Container } from "@/components/ui/Container";
import {
  WifiIcon,
  PlugIcon,
  LeafIcon,
  MosqueIcon,
} from "@/components/ui/icons";

interface FacilityItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const facilitiesData: FacilityItem[] = [
  {
    id: "wifi",
    title: "Wi-Fi kencang & stabil",
    description:
      "Cukup untuk meeting online, kirim berkas, dan kerja remote seharian tanpa putus.",
    icon: WifiIcon,
  },
  {
    id: "plug",
    title: "Stopkontak di hampir tiap meja",
    description:
      "Tersedia di meja jendela, meja komunal, dan sudut dinding tanpa rebutan.",
    icon: PlugIcon,
  },
  {
    id: "outdoor",
    title: "Area semi-outdoor teduh",
    description:
      "Beratap dengan sirkulasi udara alami; boleh merokok dan ramah anabul berkalung tali.",
    icon: LeafIcon,
  },
  {
    id: "mosque",
    title: "Musholla & toilet bersih",
    description:
      "Ruang ibadah terawat lengkap dengan sajadah, mukena, dan tempat wudhu terpisah.",
    icon: MosqueIcon,
  },
];

/**
 * FacilitiesBar — Section fasilitas utama kedai tepat di bawah Hero.
 */
export function FacilitiesBar(): React.JSX.Element {
  return (
    <section
      id="fasilitas"
      aria-labelledby="facilities-heading"
      className="border-t border-offwhite/15 bg-charcoal-darkest py-12 text-offwhite md:py-16"
    >
      <Container>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label">Fasilitas Kedai</p>
            <h2 id="facilities-heading" className="mt-2 font-serif text-2xl text-offwhite sm:text-3xl">
              Siap untuk duduk lama, kerja, atau singgah santai.
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {facilitiesData.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex flex-col border-t border-offwhite/15 pt-4 sm:border-t-0 sm:pt-0 lg:border-l lg:border-offwhite/15 lg:px-6 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
              >
                <div className="flex items-center gap-3">
                  <span className="shrink-0 text-terracotta-light" aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-sans text-base font-medium leading-snug text-offwhite">
                    {item.title}
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-offwhite-muted">
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

