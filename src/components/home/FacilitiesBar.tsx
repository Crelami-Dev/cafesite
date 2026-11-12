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
  /** Versi ringkas untuk mobile. */
  shortTitle: string;
  shortDescription: string;
  icon: React.ComponentType<{ className?: string }>;
}

const facilitiesData: FacilityItem[] = [
  {
    id: "wifi",
    title: "Wi-Fi kencang & stabil",
    description:
      "Cukup untuk meeting online, kirim berkas, dan kerja remote seharian tanpa putus.",
    shortTitle: "Wi-Fi kencang",
    shortDescription: "Aman untuk meeting online.",
    icon: WifiIcon,
  },
  {
    id: "plug",
    title: "Stopkontak di hampir tiap meja",
    description:
      "Tersedia di meja jendela, meja komunal, dan sudut dinding tanpa rebutan.",
    shortTitle: "Stopkontak banyak",
    shortDescription: "Hampir di tiap meja.",
    icon: PlugIcon,
  },
  {
    id: "outdoor",
    title: "Area semi-outdoor teduh",
    description:
      "Beratap dengan sirkulasi udara alami; boleh merokok dan ramah anabul berkalung tali.",
    shortTitle: "Semi-outdoor",
    shortDescription: "Teduh, boleh merokok.",
    icon: LeafIcon,
  },
  {
    id: "mosque",
    title: "Musholla & toilet bersih",
    description:
      "Ruang ibadah terawat lengkap dengan sajadah, mukena, dan tempat wudhu terpisah.",
    shortTitle: "Musholla & toilet",
    shortDescription: "Bersih, ada mukena.",
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
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
          <div>
            <p className="section-label">Fasilitas Kedai</p>
            <h2 id="facilities-heading" className="mt-2 font-serif text-2xl text-offwhite sm:text-3xl">
              <span className="sm:hidden">Buat kerja atau singgah santai.</span>
              <span className="hidden sm:inline">Siap untuk duduk lama, kerja, atau singgah santai.</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-5 sm:gap-6 lg:grid-cols-4 lg:gap-0">
          {facilitiesData.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex flex-col border-t border-offwhite/15 pt-4 sm:border-t-0 sm:pt-0 lg:border-l lg:border-offwhite/15 lg:px-6 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
              >
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <span className="shrink-0 text-terracotta-light" aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-sans text-[15px] font-medium leading-snug text-offwhite sm:text-base">
                    <span className="sm:hidden">{item.shortTitle}</span>
                    <span className="hidden sm:inline">{item.title}</span>
                  </h3>
                </div>
                <p className="mt-1 text-[13px] leading-snug text-offwhite-muted sm:mt-2 sm:text-sm sm:leading-relaxed">
                  <span className="sm:hidden">{item.shortDescription}</span>
                  <span className="hidden sm:inline">{item.description}</span>
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

