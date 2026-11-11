/**
 * Data pemilih menu "Bingung pesan apa?".
 * Dipakai oleh src/lib/menu-recommendation.ts (logic murni) dan UI MenuPicker.
 *
 * Pilihan rasa mengikuti kategori yang dipilih: kopi tidak ditawari "gurih", camilan tidak ditawari "pekat".
 */

export type CravingId = "coffee" | "non-coffee" | "food" | "snack" | "dessert";
export type FlavorId = "sweet" | "refreshing" | "bold" | "creamy" | "savory" | "spicy" | "light";

export interface PickerOption<Id extends string> {
  id: Id;
  label: string;
  sublabel: string;
}

export const CRAVING_OPTIONS: readonly PickerOption<CravingId>[] = [
  { id: "coffee", label: "Kopi", sublabel: "Biar melek dan tenang" },
  { id: "non-coffee", label: "Bukan Kopi", sublabel: "Teh, matcha, atau soda" },
  { id: "food", label: "Makanan", sublabel: "Yang bikin kenyang" },
  { id: "snack", label: "Camilan", sublabel: "Buat ngemil sambil ngobrol" },
  { id: "dessert", label: "Penutup", sublabel: "Manis-manis di akhir" },
];

/** Rasa yang masuk akal untuk tiap kategori, dengan label yang sesuai jenis menunya. */
export const CRAVING_FLAVORS: Readonly<Record<CravingId, readonly PickerOption<FlavorId>[]>> = {
  coffee: [
    { id: "sweet", label: "Manis", sublabel: "Dengan susu, ramah di lidah" },
    { id: "refreshing", label: "Segar", sublabel: "Asamnya cerah dan ringan" },
    { id: "bold", label: "Pekat", sublabel: "Kopi hitam yang tegas" },
  ],
  "non-coffee": [
    { id: "sweet", label: "Manis", sublabel: "Yang bikin senyum" },
    { id: "refreshing", label: "Segar", sublabel: "Dingin dan ringan" },
    { id: "creamy", label: "Creamy", sublabel: "Lembut dengan susu" },
  ],
  food: [
    { id: "creamy", label: "Creamy", sublabel: "Gurih dan lembut" },
    { id: "spicy", label: "Berempah", sublabel: "Bumbunya berani" },
  ],
  snack: [
    { id: "savory", label: "Gurih", sublabel: "Asin yang bikin nagih" },
    { id: "spicy", label: "Pedas", sublabel: "Yang nendang" },
  ],
  dessert: [
    { id: "sweet", label: "Manis", sublabel: "Lumer dan legit" },
    { id: "light", label: "Ringan", sublabel: "Renyah, nggak terlalu manis" },
  ],
};

/** Tag item menu (case-insensitive) yang cocok dengan tiap profil rasa. Bobot +2 per tag. */
export const FLAVOR_TAG_MAP: Readonly<Record<FlavorId, readonly string[]>> = {
  sweet: ["Sweet", "Dessert"],
  refreshing: ["Refreshing", "Citrus", "Iced", "Mocktail"],
  bold: ["Single Origin", "Sugar Free", "Strong"],
  creamy: ["Creamy", "Rich"],
  savory: ["Savory", "Sharing"],
  spicy: ["Spicy", "Hearty"],
  light: ["Fresh Baked", "French", "Light"],
};

/** Kata di nama/deskripsi item (huruf kecil) yang mendukung profil rasa. Bobot +1 per kata. */
export const FLAVOR_KEYWORDS: Readonly<Record<FlavorId, readonly string[]>> = {
  sweet: ["manis", "caramel", "karamel", "madu", "cokelat", "coklat", "lumer"],
  refreshing: ["segar", "asem", "asam", "dingin", "soda", "mint", "leci", "floral", "fruity", "acidity"],
  bold: ["pekat", "espresso", "single origin", "hitam", "tegas"],
  creamy: ["creamy", "susu", "lembut", "parmesan", "keju"],
  savory: ["gurih", "asin", "truffle", "parmesan", "keju", "kentang"],
  spicy: ["pedas", "rempah", "sambal", "rujak", "cabai", "nendang"],
  light: ["renyah", "ringan", "butter", "mentega", "croissant"],
};

/**
 * Alasan singkat (<= 18 kata) untuk item yang kami kenal. Kunci: `${item.id}:${flavorId}`.
 * Item di luar daftar ini (mis. dari CMS) memakai GENERIC_REASONS.
 */
export const RECOMMENDATION_REASONS: Readonly<Record<string, string>> = {
  "c-02:sweet": "Espresso, susu, dan caramel yang manis. Enak kalau kamu pengin ngopi yang ramah.",
  "c-03:refreshing": "Seduhan manual yang asamnya cerah, ada nuansa bunga dan buah. Kami rasa kamu bakal suka.",
  "c-01:bold": "Espresso single origin Sumatra yang terasa penuh, buat kamu yang suka kopi apa adanya.",
  "nc-02:sweet": "Teh berry dengan asam manis yang bikin kamu nggak bosen, tanpa kopi sama sekali.",
  "nc-03:refreshing": "Dingin, bersoda, dan ada mint. Kami rasa cocok buat kamu pas siang panas.",
  "nc-01:creamy": "Matcha Uji asli dengan susu yang creamy, lembut dan terasa penuh buat kamu.",
  "f-02:creamy": "Fettuccine creamy dengan parmesan dan smoked chicken, gurih dan terasa penuh buat kamu.",
  "f-01:spicy": "Nasi goreng rempah dengan ayam suwir dan acar. Cocok buat kamu yang lapar.",
  "s-01:savory": "Kentang goreng dengan truffle dan parmesan, gurih dan pas dibagi berdua sama kamu.",
  "s-02:spicy": "Cireng dengan sambal rujak yang asam dan nendang, bikin kamu nggak enek ngemil.",
  "d-02:sweet": "Atasnya karamel, dalamnya lumer. Manisnya pas buat kamu yang pengin menutup makan.",
  "d-01:light": "Lapisannya renyah dan wangi butter, penutup ringan buat kamu yang nggak mau terlalu manis.",
};

/** Alasan generik per profil rasa. `{name}` diganti nama item. */
export const GENERIC_REASONS: Readonly<Record<FlavorId, string>> = {
  sweet: "{name} punya rasa manis yang pas buat kamu yang lagi pengin yang manis.",
  refreshing: "{name} terasa segar, kami rasa cocok buat kamu yang pengin yang ringan.",
  bold: "{name} rasanya pekat dan tegas, kami rasa cocok buat kamu.",
  creamy: "{name} lembut dan creamy, kami rasa cocok buat kamu.",
  savory: "{name} gurihnya terasa, kami rasa cocok buat kamu ngemil.",
  spicy: "{name} bumbunya berani, kami rasa cocok buat kamu yang suka nendang.",
  light: "{name} ringan dan nggak bikin enek, kami rasa cocok buat kamu.",
};

/** Kalimat cadangan. `{name}` diganti nama item. */
export const FALLBACK_REASON_CATEGORY = "Belum ada yang pas persis buat seleramu, jadi kami pilihkan {name} dari kategori ini.";
export const FALLBACK_REASON_ANY = "Kategori itu lagi kosong, jadi kami pilihkan {name} dari menu yang tersedia.";
export const FALLBACK_REASON_EMPTY = "Menu belum bisa kami tampilkan sekarang. Coba lagi sebentar atau lihat halaman menu.";
