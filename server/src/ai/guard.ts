export const OFF_TOPIC_REPLY = "Maaf, saya hanya bisa membantu soal CafeSite ☕ Tanya seputar menu, jam buka, atau lokasi ya.";
export const SAFETY_REPLY = "Maaf, itu di luar yang bisa saya bantu. Saya bisa bantu soal menu, harga, jam buka, lokasi, meja, dan pemesanan ☕";
export const GREETING_REPLY = "Halo! Ada yang bisa saya bantu? Tanya menu, harga, jam buka, lokasi, atau ketik \"pesan\" untuk memesan ☕";
export const THANKS_REPLY = "Sama-sama! Kabari kalau butuh bantuan lagi ☕";
export const NEGATION_REPLY = "Siap! Kalau nanti butuh apa-apa, tinggal bilang ya ☕";
export const IDENTITY_REPLY = "Aku asisten WhatsApp CafeSite 😊 Bisa bantu soal menu, jam buka, lokasi, atau pesanan. Mau lihat menu? Ketik *menu* ☕";
export const LAUGH_REPLY = "😄 Kalau ada yang mau ditanyakan soal menu atau pesanan, aku siap bantu ☕";

export type GuardVerdict = { kind: "allow" } | { kind: "reply"; text: string; /** obrolan ringan: pemanggil boleh menyesuaikan balasan */ smalltalk?: "thanks" | "negation" | "identity" | "laugh" | "greeting" };

/** Mencoba mengubah aturan bot atau membocorkan prompt. */
const INJECTION = [
  /\b(abaikan|lupakan|acuhkan|hiraukan)\b.{0,30}\b(instruksi|aturan|perintah|prompt)/i,
  /\bignore\b.{0,30}\b(instruction|rule|prompt)/i,
  /\b(system prompt|prompt sistem|developer mode|mode developer|jailbreak)\b/i,
  /\b(tampilkan|tunjukkan|bocorkan|sebutkan|show|reveal)\b.{0,30}\b(prompt|instruksi|aturan)/i,
  /\b(pura-?pura|berperanlah|bertindaklah|act as|roleplay)\b/i,
];

/** Resep/detail produksi dan data pribadi: sengaja tidak dijawab. */
const RESTRICTED = [
  /\b(resep|takaran|komposisi rahasia)\b/i,
  /\bcara\s+(membuat|bikin|buat|menyeduh|memasak|masak)\b/i,
  /\b(gaji|password|kata sandi|rekening|nik|alamat rumah)\b/i,
  /\b(nomor|no\.?|kontak|data|info)\s+(pribadi\s+)?(pemilik|owner|karyawan|pegawai|barista|pelanggan|customer)\b/i,
  /\b(pesanan|order|data)\s+(orang lain|pelanggan lain|customer lain)\b/i,
  // Data usaha (omzet, jumlah pesanan/pelanggan lain): bukan untuk dibagikan lewat bot.
  /\b(?:omzet|penjualan|pendapatan|laba|keuntungan)\b/i,
  /\b(?:yang|jumlah|total|berapa banyak)\s+(?:pesan|pesen|order|pelanggan|pembeli|customer)\b(?!.*\b(?:saya|aku|ku|gue)\b)/i,
];

const GREETING = /^(halo|hai|hi|hello|hey|hei|selamat\s+(pagi|siang|sore|malam)|assalamu'?alaikum|permisi|p|ping)[\s!.,]*(kak|min|admin|bot)?[\s!.]*$/i;
const THANKS_WORD = /\b(terima\s*kasih|makasih|makasi|thanks|thank you|thx|tengkyu|suwun|matur nuwun|nuhun)\b/i;
const THANKS_SHORT = /^(?:oke|ok|okay|okey|sip+|siap|mantap|baik|yoi|good|sama[- ]sama|oke deh|oke siap|ya sudah|yaudah|ya udah|oke makasih)[\s!.,]*(?:kak|min|admin)?[\s!.]*$/i;
const NEGATION = /^(?:kaga|kagak|gak|ga|gk|nggak|ngga|enggak|engga|tidak|belum|nope|no|nanti(?: aja| dulu)?)(?:\s+(?:usah|dulu|deh|makasih|terima kasih|kak|aja|ya))*[\s!.]*$/i;
const IDENTITY = /^(?:(?:kamu|kau|km|anda) siapa|(?:kamu |kau |km |anda )?(?:siapa (?:kamu|kau|km|anda|namamu|nama kamu)|lagi apa|lagi ngapain|ngapain|apa kabar|kabar(?:nya)?|nama(?:mu| kamu) siapa|kamu bot|kamu robot|kamu manusia|bot ya|ini bot))\b.{0,15}$/i;
const LAUGH = /^(?:w?k(?:w?k)+|haha+(?:ha)*|hehe+|hihi+|lol|wkwk\w*|awok\w*)[\s!.]*$/i;

/**
 * Daftar kata kunci topik kafe. Nama menu dari database ditambahkan lewat `extraKeywords`
 * supaya "americano berapa?" lolos walau kata "menu" tidak muncul.
 */
const CAFE_KEYWORDS: readonly string[] = [
  "menu", "harga", "kopi", "espresso", "latte", "cappuccino", "matcha", "croissant", "americano", "mocktail", "teh", "coklat", "cokelat",
  "minum", "makan", "dessert", "snack", "jam", "buka", "tutup", "lokasi", "alamat", "maps", "peta", "meja", "pesan", "pesen", "order", "booking",
  "reservasi", "cafesite", "cafe", "kafe", "kedai", "wifi", "parkir", "toilet", "mushola", "colokan", "bayar", "cod", "kasir", "promo",
  "diskon", "antrian", "antrean", "dine in", "takeaway", "bawa pulang", "open", "close", "where", "price", "table", "rekomendasi",
  "tersedia", "habis", "vegan", "manis", "pahit", "asam", "creamy", "segar", "dingin", "panas", "susu", "enak", "murah", "laris", "favorit", "signature", "porsi", "kenyang", "lapar", "haus", "sarapan", "camilan", "cemilan", "roti", "kue", "nasi", "mie", "ayam", "pedas", "kafein", "decaf", "boba", "jus", "smoothie", "cold brew", "arabika", "robusta", "gula", "es ", "halal", "alergi", "kapasitas", "acara", "hari ini", "besok", "weekend", "status", "pesanan",
];

/** Pesan lanjutan khas: diawali kata sambung, atau berakhiran -nya ("harganya?", "jamnya?") dan singkat. */
function looksLikeFollowUp(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (/^(kalau|kalo|klo|terus|trus|lalu|dan|yang|nah|jadi|bagaimana dengan|gimana dengan|buat|untuk|emang|memang)\b/.test(lower)) return true;
  return lower.split(/\s+/).length <= 3 && /\b\w{3,}nya\b/.test(lower) && !/\b(siapa|kenapa|mengapa|apa itu|presiden|berita|cuaca)\b/.test(lower);
}

export function checkMessage(text: string, extraKeywords: readonly string[] = [], inConversation = false): GuardVerdict {
  const trimmed = text.trim();
  if (INJECTION.some((pattern) => pattern.test(trimmed)) || RESTRICTED.some((pattern) => pattern.test(trimmed))) return { kind: "reply", text: SAFETY_REPLY };
  if (GREETING.test(trimmed)) return { kind: "reply", text: GREETING_REPLY, smalltalk: "greeting" };
  if (LAUGH.test(trimmed)) return { kind: "reply", text: LAUGH_REPLY, smalltalk: "laugh" };
  if (IDENTITY.test(trimmed)) return { kind: "reply", text: IDENTITY_REPLY, smalltalk: "identity" };
  const wordCount = trimmed.split(/\s+/).length;
  if (THANKS_SHORT.test(trimmed) || (THANKS_WORD.test(trimmed) && wordCount <= 5)) return { kind: "reply", text: THANKS_REPLY, smalltalk: "thanks" };
  if (NEGATION.test(trimmed)) return { kind: "reply", text: NEGATION_REPLY, smalltalk: "negation" };
  const normalized = trimmed.toLowerCase();
  const keywords = [...CAFE_KEYWORDS, ...extraKeywords.map((word) => word.toLowerCase()).filter((word) => word.length >= 3)];
  return (inConversation && looksLikeFollowUp(trimmed)) || keywords.some((keyword) => normalized.includes(keyword)) ? { kind: "allow" } : { kind: "reply", text: OFF_TOPIC_REPLY };
}

/** Kompatibel dengan pemakaian lama: true bila pesan lolos guard. */
export function isCafeRelated(text: string, extraKeywords: readonly string[] = []): boolean {
  return checkMessage(text, extraKeywords).kind === "allow";
}
