/**
 * Data pemilih menu "Bingung pesan apa?".
 * Dipakai oleh src/lib/menu-recommendation.ts (logic murni) dan UI MenuPicker.
 */

export type CravingId = "coffee" | "non-coffee" | "food" | "snack" | "dessert";
export type FlavorId = "sweet" | "refreshing" | "rich-savory";

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

export const FLAVOR_OPTIONS: readonly PickerOption<FlavorId>[] = [
  { id: "sweet", label: "Manis", sublabel: "Yang bikin senyum" },
  { id: "refreshing", label: "Segar", sublabel: "Ringan dan nggak enek" },
  { id: "rich-savory", label: "Gurih / Pekat", sublabel: "Rasanya terasa penuh" },
];

/** Tag item menu (case-insensitive) yang cocok dengan tiap profil rasa. Bobot +2 per tag. */
export const FLAVOR_TAG_MAP: Readonly<Record<FlavorId, readonly string[]>> = {
  sweet: ["Sweet", "Dessert"],
  refreshing: ["Refreshing", "Citrus", "Iced", "Mocktail"],
  "rich-savory": ["Rich", "Creamy", "Hearty", "Single Origin"],
};

/** Kata di nama/deskripsi item (huruf kecil) yang mendukung profil rasa. Bobot +1 per kata. */
export const FLAVOR_KEYWORDS: Readonly<Record<FlavorId, readonly string[]>> = {
  sweet: ["manis", "caramel", "karamel", "madu", "cokelat", "coklat"],
  refreshing: ["segar", "asem", "asam", "dingin", "soda", "mint", "leci", "acar", "floral", "fruity", "acidity"],
  "rich-savory": ["gurih", "pekat", "creamy", "susu", "parmesan", "truffle", "rempah", "espresso", "single origin", "lumer"],
};

/**
 * Alasan singkat (<= 18 kata) untuk item yang kami kenal. Kunci: `${item.id}:${flavorId}`.
 * Item di luar daftar ini (mis. dari CMS) memakai GENERIC_REASONS.
 */
export const RECOMMENDATION_REASONS: Readonly<Record<string, string>> = {
  "c-02:sweet": "Espresso, susu, dan caramel yang manis. Enak kalau kamu pengin ngopi yang ramah.",
  "c-03:refreshing": "Seduhan manual yang asamnya cerah, ada nuansa bunga dan buah. Kami rasa kamu bakal suka.",
  "c-01:rich-savory": "Espresso single origin Sumatra yang terasa penuh, buat kamu yang suka kopi apa adanya.",
  "nc-02:sweet": "Teh berry dengan asam manis yang bikin kamu nggak bosen, tanpa kopi sama sekali.",
  "nc-03:refreshing": "Dingin, bersoda, dan ada mint. Kami rasa cocok buat kamu pas siang panas.",
  "nc-01:rich-savory": "Matcha Uji asli dengan susu yang creamy, lembut dan terasa penuh buat kamu.",
  "f-01:refreshing": "Nasi goreng rempah dengan acar yang menyegarkan di sela suapan. Cocok buat kamu yang lapar.",
  "f-02:rich-savory": "Fettuccine creamy dengan parmesan dan smoked chicken, gurih dan terasa penuh buat kamu.",
  "s-02:refreshing": "Cireng dengan sambal rujak yang asam dan nendang, bikin kamu nggak enek ngemil.",
  "s-01:rich-savory": "Kentang goreng dengan truffle dan parmesan, gurih dan pas dibagi berdua sama kamu.",
  "d-02:sweet": "Atasnya karamel, dalamnya lumer. Manisnya pas buat kamu yang pengin menutup makan.",
  "d-02:rich-savory": "Lumer dan terasa penuh, buat kamu yang suka penutup yang tegas rasanya.",
};

/** Alasan generik per profil rasa. `{name}` diganti nama item. */
export const GENERIC_REASONS: Readonly<Record<FlavorId, string>> = {
  sweet: "{name} punya rasa manis yang pas buat kamu yang lagi pengin yang manis.",
  refreshing: "{name} terasa segar, kami rasa cocok buat kamu yang pengin yang ringan.",
  "rich-savory": "{name} rasanya penuh dan gurih, kami rasa cocok buat kamu.",
};

/** Kalimat cadangan. `{name}` diganti nama item. */
export const FALLBACK_REASON_CATEGORY = "Belum ada yang pas persis buat seleramu, jadi kami pilihkan {name} dari kategori ini.";
export const FALLBACK_REASON_ANY = "Kategori itu lagi kosong, jadi kami pilihkan {name} dari menu yang tersedia.";
export const FALLBACK_REASON_EMPTY = "Menu belum bisa kami tampilkan sekarang. Coba lagi sebentar atau lihat halaman menu.";
