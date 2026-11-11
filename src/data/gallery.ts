import { GalleryCategory, GalleryPhoto } from "@/types";

export interface GalleryCategoryMeta {
  id: "all" | GalleryCategory;
  name: string;
}

export const galleryCategories: GalleryCategoryMeta[] = [
  { id: "all", name: "Semua" },
  { id: "interior", name: "Interior" },
  { id: "exterior", name: "Eksterior" },
  { id: "coffee", name: "Kopi" },
  { id: "food", name: "Makanan" },
  { id: "atmosphere", name: "Suasana" },
];

/**
 * Data foto galeri CafeSite.
 * // TODO: ganti dengan path foto asli client sesuai checklist PHOTO_BRIEF.md
 * Caption bernada kenangan kasual, hangat, jujur, tanpa klise AI.
 */
export const galleryPhotos: GalleryPhoto[] = [
  {
    id: "gal-01",
    category: "interior",
    aspect: "landscape",
    year: "2024",
    title: "Meja Pojok Jendela",
    src: "/Image/Gallery/gal-01-window-table.jpg",
    alt: "Meja pojok kayu di samping jendela kafe dengan cahaya sore yang hangat",
    caption:
      "Sudut ini yang biasanya dipilih orang yang lagi mikir atau sekadar males ditanya-tanya.",
  },
  {
    id: "gal-02",
    category: "coffee",
    aspect: "portrait",
    year: "2024",
    title: "Seduhan Pagi Hari",
    src: "/Image/Gallery/gal-02-morning-brew.jpg",
    alt: "Barista menyeduh kopi manual brew V60 dengan uap mengepul hangat",
    caption:
      "Uap pertama dari cangkir V60 pagi hari. Kadang kopinya cuma alasan buat duduk diam.",
  },
  {
    id: "gal-04",
    category: "atmosphere",
    aspect: "square",
    year: "2024",
    title: "Sudut Tenang",
    src: "/Image/Gallery/gal-04-quiet-corner.jpg",
    alt: "Cangkir kopi susu dan buku catatan di meja kayu CafeSite, tanaman hijau di belakang",
    caption:
      "Seseorang yang duduk sendirian di pojok, nggak buka HP, cuma mandang ke luar lama banget.",
  },
  {
    id: "gal-05",
    category: "food",
    aspect: "portrait",
    year: "2024",
    title: "Pasta Hangat Sore",
    src: "/Image/Gallery/gal-05-pasta-sore.jpg",
    alt: "Sepiring fettuccine carbonara creamy hangat dengan potongan ayam panggang",
    caption:
      "Pasta hangat pas hujan deras di luar. Porsinya pas buat nemenin sampai gerimis reda.",
  },
  {
    id: "gal-06",
    category: "interior",
    aspect: "portrait",
    year: "2024",
    title: "Ruang Baca Terang",
    src: "/Image/Gallery/gal-06-lampu-bar.jpg",
    alt: "Ruang dalam CafeSite yang terang: tamu membaca di kursi kayu dekat jendela besar",
    caption:
      "Jendela besar, kursi kayu, dan buku di tangan. Sudut ini paling cepat penuh kalau siang.",
  },
  {
    id: "gal-07",
    category: "coffee",
    aspect: "landscape",
    year: "2024",
    title: "Americano di Meja Kayu",
    src: "/Image/Gallery/gal-07-dua-cangkir.jpg",
    alt: "Dua cangkir americano di meja kayu CafeSite",
    caption:
      "Dua cangkir sisa obrolan dua jam. Yang satu habis duluan, yang satu dingin pelan-pelan.",
  },
  {
    id: "gal-09",
    category: "food",
    aspect: "square",
    year: "2024",
    title: "Butter Croissant",
    src: "/Image/Gallery/gal-09-croissant.jpg",
    alt: "Artisanal butter croissant renyah keemasan di atas papan kayu",
    caption:
      "Croissant yang renyah berantakan di meja. Remahannya sengaja nggak langsung dibersihin.",
  },
  {
    id: "gal-12",
    category: "coffee",
    aspect: "square",
    year: "2024",
    title: "Latte di Meja Kayu",
    src: "/Image/Gallery/gal-12-latte-kayu.png",
    alt: "Caramel macchiato dengan saus karamel lezat di atas meja kayu",
    caption:
      "Latte hangat di meja kayu. Busa susunya tebal, belum diaduk karena sayang.",
  },
  {
    id: "gal-13",
    category: "food",
    aspect: "landscape",
    year: "2024",
    title: "Nasi Goreng Kampung",
    src: "/Image/Gallery/gal-13-nasgor.jpg",
    alt: "Sepiring nasi goreng kampung rempah dengan telur mata sapi dan kerupuk",
    caption:
      "Sepiring nasi goreng yang dipesen pas jam nanggung, waktu perut mulai rewel minta diisi.",
  },
];
