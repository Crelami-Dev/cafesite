import React from "react";
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
    title: "Wi-Fi stabil",
    description:
      "Koneksi memadai untuk kerja remote atau kirim berkas tanpa putus.",
    icon: WifiIcon,
  },
  {
    id: "plug",
    title: "Stopkontak di beberapa area",
    description:
      "Tersedia di meja kerja dan sudut dinding untuk mengisi daya perangkat.",
    icon: PlugIcon,
  },
  {
    id: "outdoor",
    title: "Semi-outdoor teduh",
    description:
      "Area santai dengan sirkulasi udara alami dan tanaman sejuk.",
    icon: LeafIcon,
  },
  {
    id: "mosque",
    title: "Musholla bersih",
    description:
      "Ruang ibadah terawat dengan tempat wudhu bersih terpisah.",
    icon: MosqueIcon,
  },
];

/**
 * FacilitiesBar Component (Server Component)
 * Section 6 — Daftar ringkas bergaris 4 fasilitas jujur CafeSite tanpa box card.
 */
export function FacilitiesBar(): React.JSX.Element {
  return (
    <section
      id="fasilitas"
      aria-labelledby="facilities-heading"
      className="border-t border-offwhite/15 bg-charcoal py-12 md:py-16 text-offwhite"
    >
      <Container>
        <h2 id="facilities-heading" className="sr-only">
          Fasilitas CafeSite
        </h2>
        <div className="m-rail m-rail--sm grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4 lg:gap-0">
          {facilitiesData.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex flex-col border-t border-offwhite/15 pt-4 md:border-t-0 md:pt-0 lg:border-l lg:border-offwhite/15 lg:pl-6 lg:pr-6 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
              >
                <div className="flex items-center gap-3">
                  <span className="shrink-0 text-terracotta-light" aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-sans text-sm font-semibold tracking-wide text-offwhite sm:text-base">
                    {item.title}
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-offwhite-muted sm:text-sm">
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

