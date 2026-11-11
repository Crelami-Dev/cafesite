import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CafePhoto } from "./CafePhoto";
import type { CafeInfo, GalleryPhoto } from "@/types";

// TODO: konfirmasi cerita dan tiga nilai kedai dengan client (copy contoh mengikuti BRAND_VOICE.md).
const VALUES = [
  {
    id: "biji",
    title: "Biji dari sumbernya",
    text: "Kami beli dari petani yang kami kenal dan menyangrai rutin. Soal rasa, kami nggak mau ngarang.",
    src: "/Image/Menu/V60.png",
    alt: "Kopi manual brew V60 dituang dari server kaca ke gelas",
  },
  {
    id: "seduh",
    title: "Seduh yang nggak buru-buru",
    text: "V60 atau kopi susu, takarannya dihitung. Sisanya menunggu sampai rasanya pas.",
    src: "/Image/Gallery/gal-02-morning-brew.jpg",
    alt: "Barista CafeSite menuang kopi hasil seduhan manual ke cangkir putih",
  },
  {
    id: "ruang",
    title: "Ruang buat duduk lama",
    text: "Colokan dekat, cahaya teduh, kursi enak. Kerja atau ngobrol, dua-duanya kerasan.",
    src: "/Image/Gallery/gal-06-lampu-bar.jpg",
    alt: "Ruang dalam CafeSite yang terang dengan tamu membaca di dekat jendela",
  },
] as const;

/** Halaman Tentang: cerita kedai (teks kiri, foto kanan), tiga hal yang dijaga, lalu ajakan memesan. */
export function AboutContent({
  cafe,
  photos,
}: {
  cafe?: CafeInfo;
  photos?: GalleryPhoto[];
}): React.JSX.Element {
  const storyPhoto = photos?.[0] ?? {
    src: "/Image/Gallery/gal-01-window-table.jpg",
    alt: `Meja kayu di samping jendela ${cafe?.name ?? "CafeSite"} dengan cangkir kopi dan cahaya siang`,
  };
  return (
    <>
      <section className="home-section" aria-labelledby="about-story-heading">
        <Container>
          <div className="story-split">
            <div data-reveal-group>
              <h2 id="about-story-heading" className="public-h2">
                Cerita kedai: kopi yang nggak diburu
              </h2>
              <div className="mt-6 max-w-xl space-y-4 text-lg leading-relaxed text-offwhite-muted">
                <p>
                  Banyak kafe ingin mejanya cepat kosong. Kami nggak. Kopinya diracik santai, kursinya sengaja dibuat
                  nyaman, dan kamu boleh duduk sampai sore tanpa ditanya-tanya.
                </p>
                <p>
                  Dari biji sampai lampunya, semua kami pilih dengan satu pertanyaan: enak nggak buat duduk lama? Kalau
                  enak, kami simpan. Kalau nggak, kami ganti.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <Button href="/menu" variant="outline" size="lg">
                  Lihat menu & harga
                </Button>
                <Link className="link inline-flex min-h-11 items-center text-base" href="/gallery">
                  Lihat galeri <span className="ml-2" aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
            <CafePhoto
              src={storyPhoto.src || "/Image/Gallery/gal-01-window-table.jpg"}
              alt={storyPhoto.alt || `Suasana ${cafe?.name ?? "CafeSite"}`}
              className="aspect-[4/5] w-full"
              sizes="(min-width: 1024px) 588px, 100vw"
              moment
            />
          </div>
        </Container>
      </section>

      <section className="home-section" aria-labelledby="about-values-heading">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4" data-reveal>
            <h2 id="about-values-heading" className="public-h2">
              Tiga hal yang kami jaga
            </h2>
            <Link className="link inline-flex min-h-11 items-center text-base" href="/location">
              Lokasi dan jam buka <span className="ml-2" aria-hidden="true">↗</span>
            </Link>
          </div>
          <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
            {VALUES.map((value) => (
              <li key={value.id}>
                <CafePhoto src={value.src} alt={value.alt} className="aspect-[4/3] w-full" sizes="(min-width: 1024px) 384px, 100vw" reveal />
                <div data-reveal>
                  <h3 className="mt-5 text-xl font-medium">{value.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-offwhite-muted">{value.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-12" data-reveal>
            <Button href="/order" size="lg">
              Pesan menu <span aria-hidden="true">↗</span>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
