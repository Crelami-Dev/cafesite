import { LocationFaqItem, TransportGuideItem } from "@/types";

/**
 * Panduan transportasi & aksesibilitas menuju CafeSite.
 * // TODO: konfirmasi detail akses dan kapasitas parkir asli ke client
 */
export const transportGuides: TransportGuideItem[] = [
  {
    id: "guide-parking",
    title: "Parkir Motor & Mobil",
    description:
      "Parkir motor tersedia aman tepat di pelataran depan kedai. Untuk mobil ada 4–5 slot di halaman; kalau lagi ramai, bisa parkir paralel di bahu jalan yang teduh.",
    icon: "parking",
  },
  {
    id: "guide-landmark",
    title: "Patokan Menuju Lokasi",
    description:
      "Sekitar 100 meter dari perempatan lampu merah, persis berseberangan dengan taman kota. Cari bangunan bata ekspos dengan kanopi terracotta dan plang kayu.",
    icon: "landmark",
  },
  {
    id: "guide-transit",
    title: "Akses Angkutan Umum",
    description:
      "Turun di stasiun MRT terdekat, lanjut sekitar 7 menit ojek online. Atau naik TransJakarta dan turun di halte terdekat, tinggal jalan kaki santai sekitar 5 menit.",
    icon: "transit",
  },
];

/**
 * Pertanyaan lazim (FAQ) seputar fasilitas dan kunjungan langsung ke CafeSite.
 * // TODO: konfirmasi aturan operasional aktual ke client
 */
export const locationFaqs: LocationFaqItem[] = [
  {
    id: "faq-wifi",
    question: "Ada Wi-Fi stabil dan boleh kerja bawa laptop?",
    answer:
      "Boleh banget. Wi-Fi kami stabil dan kencang untuk kerja remote atau meeting online. Kami memang rancang suasananya biar nyaman buat yang mau fokus.",
  },
  {
    id: "faq-plugs",
    question: "Banyak colokan listrik di meja?",
    answer:
      "Hampir tiap meja indoor dan meja komunal punya stopkontak sendiri di dekat dinding atau bawah meja, jadi nggak perlu rebutan colokan.",
  },
  {
    id: "faq-smoking",
    question: "Tersedia area smoking?",
    answer:
      "Ada area semi-outdoor terpisah di bagian samping yang beratap dan tetap adem. Asap rokok nggak bakal masuk ke ruang utama ber-AC.",
  },
  {
    id: "faq-prayer",
    question: "Ada musholla dan toilet bersih?",
    answer:
      "Ada toilet bersih di bagian dalam dan ruang musholla kecil lengkap dengan sajadah, sarung/mukena bersih, serta tempat wudhu yang nyaman.",
  },
  {
    id: "faq-group",
    question: "Bisa booking tempat atau reservasi meja rombongan?",
    answer:
      "Bisa. Untuk datang lebih dari 6 orang atau ada kebutuhan kumpul komunitas, kabari kami via WhatsApp beberapa jam sebelumnya biar mejanya kami gabungin.",
  },
  {
    id: "faq-food-outside",
    question: "Boleh bawa makanan atau minuman dari luar?",
    answer:
      "Mohon maaf, makanan dan minuman dari luar tidak diperkenankan ya. Pengecualian tentu buat makanan bayi atau obat-obatan pribadi.",
  },
  {
    id: "faq-wa-order",
    question: "Bisa pesan makanan/minuman lewat WhatsApp?",
    answer:
      "Fitur pemesanan otomatis lewat WhatsApp asisten sedang disiapkan (Segera Hadir). Saat ini silakan pesan langsung dari website dengan scan QR di meja atau pesan ke kasir.",
  },
];
