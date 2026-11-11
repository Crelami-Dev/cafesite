export interface ContentField {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "url" | "date";
  required?: boolean;
  options?: string[];
  optionLabels?: Record<string, string>;
}

export const contentOptionLabels: Record<string, string> = {
  interior: "Interior",
  exterior: "Eksterior",
  coffee: "Kopi",
  food: "Makanan",
  atmosphere: "Suasana",
  landscape: "Lanskap (Mendatar)",
  portrait: "Potret (Tegak)",
  square: "Persegi (1:1)",
  parking: "Parkir",
  landmark: "Patokan",
  transit: "Transportasi umum",
};

export const contentFields: Record<string, ContentField[]> = {
  gallery: [
    { key: "title", label: "Judul", required: true },
    { key: "src", label: "Foto", required: true },
    { key: "alt", label: "Teks alternatif", required: true },
    { key: "category", label: "Kategori", options: ["interior", "exterior", "coffee", "food", "atmosphere"] },
    { key: "aspect", label: "Rasio", options: ["landscape", "portrait", "square"] },
    { key: "caption", label: "Keterangan", type: "textarea" },
    { key: "year", label: "Tahun" },
  ],
  testimonials: [
    { key: "name", label: "Nama", required: true },
    { key: "source", label: "Sumber", required: true },
    { key: "rating", label: "Rating (1–5)", type: "number", required: true },
    { key: "comment", label: "Isi testimoni", type: "textarea", required: true },
    { key: "date", label: "Tanggal", type: "date" },
  ],
  faq: [
    { key: "question", label: "Pertanyaan", required: true },
    { key: "answer", label: "Jawaban", type: "textarea", required: true },
  ],
  location: [
    { key: "title", label: "Judul", required: true },
    { key: "description", label: "Petunjuk", type: "textarea", required: true },
    { key: "detail", label: "Detail", type: "textarea" },
    { key: "icon", label: "Ikon", options: ["parking", "landmark", "transit"] },
  ],
  cafe: [
    { key: "name", label: "Nama kafe", required: true },
    { key: "tagline", label: "Sapaan", required: true },
    { key: "address", label: "Alamat", type: "textarea", required: true },
    { key: "city", label: "Kota", required: true },
    { key: "landmark", label: "Patokan" },
    { key: "whatsapp", label: "WhatsApp (contoh: 6281234567890)", required: true },
    { key: "whatsappFormatted", label: "Tampilan nomor WhatsApp", required: true },
    { key: "instagram", label: "Nama akun Instagram", required: true },
    { key: "instagramUrl", label: "Tautan Instagram", type: "url", required: true },
    { key: "googleMapsUrl", label: "Tautan Google Maps", type: "url", required: true },
    { key: "googleMapsEmbedUrl", label: "URL sematan Maps", type: "url" },
  ],
};
