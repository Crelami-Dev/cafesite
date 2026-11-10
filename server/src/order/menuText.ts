import type { Db } from "../db/database";
import { fetchMenu, type MenuEntry } from "./menu";

export function formatRupiah(amount: number): string {
  return `Rp${amount.toLocaleString("id-ID")}`;
}

const DEFAULT_LABELS: Record<string, string> = { coffee: "Kopi", "non-coffee": "Non-Kopi", food: "Makanan", snack: "Camilan", dessert: "Dessert" };
const ALIASES: Record<string, string[]> = {
  coffee: ["kopi", "coffee", "espresso"],
  "non-coffee": ["non kopi", "nonkopi", "non-kopi", "teh", "tea", "minuman lain", "matcha", "soda"],
  food: ["makanan", "makan", "food", "nasi", "pasta", "berat"],
  snack: ["camilan", "cemilan", "snack", "gorengan", "ringan"],
  dessert: ["dessert", "kue", "manis", "roti", "pastry", "cake"],
};

/** Label kategori: nama dari dashboard (content 'categories') bila ada, selain itu bawaan. */
function categoryLabels(db: Db): Map<string, string> {
  const labels = new Map(Object.entries(DEFAULT_LABELS));
  try {
    const row = db.prepare("SELECT data FROM content WHERE key = 'categories'").get();
    const list = row ? (JSON.parse(String(row.data)) as unknown) : null;
    if (Array.isArray(list)) for (const item of list) {
      const entry = item as { id?: unknown; name?: unknown };
      if (typeof entry.id === "string" && typeof entry.name === "string") labels.set(entry.id, entry.name);
    }
  } catch { /* pakai label bawaan */ }
  return labels;
}

/** "menu", "daftar menu", "menu apa saja", "menu kopi", "ada menu makanan?" -> permintaan melihat menu (dengan filter opsional). */
export function parseMenuRequest(text: string): { filter: string | null } | null {
  const lower = text.toLowerCase().replace(/[?!.]/g, " ").replace(/\s+/g, " ").trim();
  const match = /^(?:tolong |boleh |bisa |kak |min )*(?:lihat |liat |kasih |minta |tampilkan |show )?(?:daftar )?(?:menu|menunya|list menu)(?: (?:apa saja|apa aja|nya|dong|lengkap|dulu|hari ini))*(?: (.+))?$/.exec(lower)
    ?? /^ada menu (.+)$/.exec(lower);
  if (!match) return null;
  const rest = (match[1] ?? "").replace(/\b(dong|ya|nih|saja|aja|apa|aja sih|sih)\b/g, "").replace(/\s+/g, " ").trim();
  // Kalimat panjang yang kebetulan memuat kata "menu" adalah pertanyaan, bukan permintaan daftar.
  if (rest.split(" ").filter(Boolean).length > 3) return null;
  return { filter: rest || null };
}

/** Topik non-menu yang sering ditanya dengan "ada ...?": jangan dianggap menu yang tidak tersedia. */
const NON_MENU_WORDS = new Set([
  "menu", "apa", "yang", "berapa", "siapa", "kapan", "dimana", "harga", "promo", "diskon", "wifi", "wi-fi", "parkir", "toilet", "wc", "mushola", "musholla", "colokan", "stopkontak", "ac",
  "meja", "kursi", "tempat", "ruang", "ruangan", "lantai", "outdoor", "indoor", "smoking", "rokok", "acara", "event", "musik", "live", "booking", "reservasi", "antar", "delivery", "gofood", "grabfood",
  "diskonan", "member", "voucher", "lowongan", "kerja", "cabang", "lokasi", "alamat", "jam", "buka", "tutup", "kasir", "antrian", "antrean", "pesanan", "orderan", "kembalian", "qris", "tunai", "cash", "kartu", "debit",
  "ada", "orang", "yang", "kamu", "anda", "saya", "aku",
]);
const DESCRIPTOR_WORDS = new Set(["manis", "pahit", "asam", "dingin", "panas", "murah", "mahal", "enak", "segar", "creamy", "vegan", "baru", "favorit", "laris", "rekomendasi", "spesial", "special", "lain", "lainnya", "lagi"]);
const LEADING_FILLER = /^(?:(?:halo|hai|hi|hei|kak|min|admin|permisi|kalau|kalo|klo|tanya|mau tanya|boleh tanya|mau nanya|nanya|oh|eh|terus|trus|lalu|dan|apakah|apa)\s+)+/;
const TRAILING_FILLER = /(?:\s+(?:kak|min|admin|dong|ya|yaa|nih|sih|deh|gak|ga|gk|nggak|ngga|enggak|tidak|kah|aja|saja|di sini|disini|di sana|hari ini))+$/;

/**
 * "ada pizza?", "pizza ready gak?", "jual burger nggak kak" -> "pizza" / "burger": nama yang ditanyakan ketersediaannya.
 * null bila bukan pertanyaan ketersediaan, atau yang ditanya jelas bukan nama makanan/minuman (wifi, parkir, "yang manis"...).
 */
export function parseAvailabilityQuestion(text: string): string | null {
  let lower = text.toLowerCase().replace(/[?!.,]/g, " ").replace(/\s+/g, " ").trim();
  lower = lower.replace(LEADING_FILLER, "").replace(TRAILING_FILLER, "").trim();
  const match = /^(?:ada|ready|jual|menjual|punya|sedia|menyediakan|tersedia|ada jual|jual ada)\s+(.+)$/.exec(lower) ?? /^(.+?)\s+(?:ada|ready|tersedia)$/.exec(lower);
  if (!match?.[1]) return null;
  const item = match[1].replace(TRAILING_FILLER, "").replace(/^(?:ada|jual|ready|menu)\s+/, "").trim();
  const words = item.split(" ").filter(Boolean);
  if (words.length === 0 || words.length > 4 || /\d/.test(item)) return null;
  if (words.some((word) => NON_MENU_WORDS.has(word))) return null;
  if (words.every((word) => DESCRIPTOR_WORDS.has(word))) return null;
  return item;
}

export function categoryMatching(db: Db, filter: string): string | null {
  const lower = filter.toLowerCase();
  const labels = categoryLabels(db);
  for (const [id, label] of labels) if (lower.includes(label.toLowerCase()) || lower === id) return id;
  for (const [id, words] of Object.entries(ALIASES)) if (words.some((word) => lower.includes(word))) return id;
  return null;
}

/**
 * Menu dari database, dikelompokkan per kategori, hanya yang tersedia. Item habis disebut di akhir agar
 * pelanggan tahu kenapa tidak ada. `detail` menambahkan deskripsi singkat.
 */
export function renderMenu(db: Db, options: { filter?: string | null; detail?: boolean } = {}): string {
  const all = fetchMenu(db);
  if (all.length === 0) return "Menu belum tersedia saat ini.";
  const labels = categoryLabels(db);
  const categoryId = options.filter ? categoryMatching(db, options.filter) : null;
  const scope = categoryId ? all.filter((entry) => entry.category === categoryId) : all;
  const available = scope.filter((entry) => entry.isAvailable);
  if (available.length === 0) return categoryId ? `Untuk ${labels.get(categoryId) ?? categoryId}, saat ini belum ada yang tersedia. Ketik "menu" untuk melihat yang lain ya.` : "Semua menu sedang habis. Coba lagi nanti ya.";

  const groups = new Map<string, MenuEntry[]>();
  for (const entry of available) groups.set(entry.category, [...(groups.get(entry.category) ?? []), entry]);
  const blocks = [...groups].map(([category, entries]) => {
    const lines = entries.map((entry) => {
      const base = `• ${entry.name} - ${formatRupiah(entry.price)}`;
      return options.detail && entry.description ? `${base}\n   ${entry.description}` : base;
    });
    return `*${labels.get(category) ?? (category || "Lainnya")}*\n${lines.join("\n")}`;
  });
  const sold = scope.filter((entry) => !entry.isAvailable).map((entry) => entry.name);
  const footer = sold.length ? `\n\n_Sedang habis: ${sold.join(", ")}_` : "";
  return `${blocks.join("\n\n")}${footer}\n\nMau pesan? Tulis langsung, contoh: "2 ${available[0]?.name.toLowerCase() ?? "americano"} dan 1 ${available[1]?.name.toLowerCase() ?? "latte"}" ☕`;
}
