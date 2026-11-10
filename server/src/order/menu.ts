import type { Db } from "../db/database";

export interface MenuEntry {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  category: string;
  description: string;
}

/** Baca menu langsung dari tabel menu_items (sumber yang sama dengan dashboard). */
export function fetchMenu(db: Db): MenuEntry[] {
  const rows = db.prepare("SELECT id, data, is_available FROM menu_items ORDER BY sort_order, id").all();
  return rows.map((row) => {
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(String(row.data)) as Record<string, unknown>; } catch { /* baris rusak: pakai default */ }
    return {
      id: String(row.id),
      name: typeof data.name === "string" ? data.name : String(row.id),
      price: typeof data.price === "number" ? data.price : 0,
      isAvailable: Number(row.is_available) === 1,
      category: typeof data.category === "string" ? data.category : "",
      description: typeof data.description === "string" ? data.description : "",
    };
  });
}

export interface MatchedLine { entry: MenuEntry; quantity: number; note: string; explicitQuantity: boolean }

export interface MenuMatchResult {
  matched: MatchedLine[];
  unavailable: MenuEntry[];
  ambiguous: { query: string; candidates: MenuEntry[] }[];
  notFound: string[];
}

const MAX_QUANTITY = 20;
const MAX_NOTE = 100;

const NUMBER_WORDS: Record<string, string> = { satu: "1", se: "1", dua: "2", tiga: "3", empat: "4", lima: "5", enam: "6", tujuh: "7", delapan: "8", sembilan: "9", sepuluh: "10" };
const FILLER = String.raw`\b(?:dong|ya|yaa|yah|nih|deh|sih|aja|saja|please|pls|plis|kak|dulu|donk|ni|tuh|saya|aku|gue|gw|mau|pengen|pingin|ingin|juga|lagi|tolong|minta)\b`;

/** "dua latte dong" -> "2 latte": kata bilangan jadi angka, kata pengisi percakapan dibuang. */
function normalizeSegment(segment: string): string {
  return segment
    .replace(new RegExp(FILLER, "gi"), " ")
    .replace(/\b(satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh)\b/gi, (word) => NUMBER_WORDS[word.toLowerCase()] ?? word)
    .replace(/\s+/g, " ")
    .trim();
}

export interface SplitPiece { query: string; quantity: number; explicitQuantity: boolean; note: string }

/**
 * Pecah teks bebas seperti "2 americano, 1 nasi goreng" atau "es kopi susu x2 + nasi goreng 3" jadi potongan.
 * Angka boleh di depan ("2 americano", "2x americano") atau di belakang ("americano 2", "americano x2").
 * Pemisah: koma, "+", titik koma, "dan", "sama", "serta", baris baru. Teks dalam kurung dianggap catatan
 * ("latte (less sugar)").
 */
export function splitCartText(text: string): SplitPiece[] {
  const segments = text
    .split(/[,;+\n]|\b(?:dan|sama|serta|plus|terus|trus)\b/i)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  return segments.map((raw) => {
    let segment = normalizeSegment(raw);
    let note = "";
    const parenthesis = /\(([^)]*)\)/.exec(segment);
    if (parenthesis) { note = (parenthesis[1] ?? "").trim(); segment = segment.replace(parenthesis[0], " ").replace(/\s+/g, " ").trim(); }
    const unit = "(?:x|buah|porsi|gelas|cup|pcs|biji|piring|mangkok|slice|potong)";
    const leading = new RegExp(`^(\\d{1,3})\\s*${unit}?\\s+(.+)$`, "i").exec(segment);
    if (leading?.[1] && leading[2]) return { query: leading[2].trim(), quantity: Number(leading[1]), explicitQuantity: true, note };
    const trailing = new RegExp(`^(.+?)\\s+(?:x\\s*)?(\\d{1,3})\\s*${unit}?$`, "i").exec(segment);
    if (trailing?.[1] && trailing[2]) return { query: trailing[1].trim(), quantity: Number(trailing[2]), explicitQuantity: true, note };
    return { query: segment, quantity: 1, explicitQuantity: false, note };
  });
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** Jarak edit (Levenshtein) untuk toleransi salah ketik: "americanno" ~ "americano". */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0] ?? 0;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j] ?? 0;
      row[j] = Math.min(current + 1, (row[j - 1] ?? 0) + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length] ?? 0;
}

function tokenClose(queryToken: string, nameToken: string): boolean {
  if (nameToken.includes(queryToken) && queryToken.length >= 3) return true;
  // Toleransi salah ketik menurut panjang kata; kata 4 huruf ("late" ~ "latte") hanya boleh 1 salah dengan huruf awal sama.
  const allowed = queryToken.length >= 7 ? 2 : queryToken.length >= 5 ? 1 : queryToken.length === 4 && queryToken[0] === nameToken[0] ? 1 : 0;
  return allowed > 0 && Math.abs(queryToken.length - nameToken.length) <= allowed && editDistance(queryToken, nameToken) <= allowed;
}

const FOOD_WORDS = /\b(?:makan|makanan|minum|minuman|kopi|teh|es|dingin|panas|hangat|manis|pahit|pedas|pedes|gurih|asin|asam|segar|snack|camilan|cemilan|kue|roti|nasi|mie|mi|pasta|kentang|ayam|dessert|cokelat|coklat|susu|krim|menu|porsi|gelas|piring)\b/i;

/**
 * Apakah kalimat ini terdengar seperti memesan sesuatu? (ada angka/kata bilangan, kata makanan-minuman, atau kata yang
 * mirip nama/deskripsi menu). Dipakai agar obrolan biasa ("kau lagi apa") tidak dikirim ke AI atau dianggap menu.
 */
export function looksLikeOrderText(text: string, menu: MenuEntry[]): boolean {
  if (quantitiesIn(text).size > 0 || FOOD_WORDS.test(text)) return true;
  const tokens = normalizeName(text).split(" ").filter((token) => token.length >= 4);
  return menu.some((entry) => normalizeName(`${entry.name} ${entry.description}`).split(" ").some((word) => word.length >= 4 && tokens.some((token) => tokenClose(token, word))));
}

/** Apakah pelanggan benar-benar menyebut (kira-kira) nama menu ini? Dipakai untuk membatasi kepercayaan pada tafsiran AI. */
export function mentionsName(text: string, entry: MenuEntry): boolean {
  const textTokens = normalizeName(text).split(" ").filter((token) => token.length >= 3);
  return normalizeName(entry.name).split(" ").filter((token) => token.length >= 4).some((nameToken) => textTokens.some((token) => tokenClose(token, nameToken)));
}

/** Semua angka yang disebut pelanggan (digit maupun kata bilangan) sebagai himpunan. */
export function quantitiesIn(text: string): Set<number> {
  const found = new Set<number>();
  for (const digit of text.match(/\d{1,2}/g) ?? []) found.add(Number(digit));
  for (const [word, value] of Object.entries(NUMBER_WORDS)) if (new RegExp("\\b" + word + "\\b", "i").test(text) && word !== "se") found.add(Number(value));
  return found;
}

/** Kandidat menu untuk satu pencarian: persis -> memuat -> semua kata (urutan bebas) -> semua kata dengan toleransi typo. */
export function findCandidates(rawQuery: string, menu: MenuEntry[]): MenuEntry[] {
  const query = normalizeName(rawQuery);
  if (query === "") return [];
  const exact = menu.filter((entry) => normalizeName(entry.name) === query);
  if (exact.length) return exact;
  const contains = menu.filter((entry) => normalizeName(entry.name).includes(query));
  if (contains.length) return contains;
  const tokens = query.split(" ");
  const allTokens = menu.filter((entry) => tokens.every((token) => normalizeName(entry.name).includes(token)));
  if (allTokens.length) return allTokens;
  return menu.filter((entry) => {
    const nameTokens = normalizeName(entry.name).split(" ");
    return tokens.every((token) => nameTokens.some((nameToken) => tokenClose(token, nameToken)));
  });
}

/**
 * Cocokkan tiap potongan ke menu. Bila "latte tanpa gula" tidak cocok utuh, kata di belakang dilepas satu per satu
 * sampai menu ketemu, dan sisanya menjadi catatan ("tanpa gula"). Beberapa kandidat -> ambiguous; item habis ->
 * unavailable; tidak ada -> notFound.
 */
export function matchCartText(text: string, menu: MenuEntry[]): MenuMatchResult {
  const result: MenuMatchResult = { matched: [], unavailable: [], ambiguous: [], notFound: [] };

  for (const piece of splitCartText(text)) {
    let quantity = Math.min(MAX_QUANTITY, Math.max(1, piece.quantity));
    let explicitQuantity = piece.explicitQuantity;
    let candidates = findCandidates(piece.query, menu);
    let note = piece.note;

    if (candidates.length === 0) {
      const words = piece.query.split(/\s+/);
      for (let keep = words.length - 1; keep >= 1 && candidates.length === 0; keep -= 1) {
        const found = findCandidates(words.slice(0, keep).join(" "), menu);
        if (found.length > 0) {
          candidates = found;
          let rest = words.slice(keep).join(" ");
          // "matcha latte 1 es batunya dikit": angka tepat setelah nama menu adalah jumlah, sisanya catatan.
          const leadingNumber = /^(\d{1,2})(?:\s+(.*))?$/.exec(rest);
          if (leadingNumber?.[1] && !explicitQuantity) { quantity = Math.min(MAX_QUANTITY, Math.max(1, Number(leadingNumber[1]))); explicitQuantity = true; rest = leadingNumber[2] ?? ""; }
          // Sisa kata yang ternyata salah ketik bagian nama menu ("karamel maciato") bukan catatan.
          const nameTokens = normalizeName(found[0]?.name ?? "").split(" ");
          const restTokens = normalizeName(rest).split(" ").filter(Boolean);
          if (found.length === 1 && restTokens.length > 0 && restTokens.every((token) => nameTokens.some((nameToken) => tokenClose(token, nameToken)))) rest = "";
          note = [rest, piece.note].filter(Boolean).join(", ");
        }
      }
    }
    note = note.slice(0, MAX_NOTE);

    if (candidates.length === 0) { if (normalizeName(piece.query) !== "") result.notFound.push(piece.query); continue; }
    if (candidates.length > 1) { result.ambiguous.push({ query: piece.query, candidates }); continue; }

    const entry = candidates[0];
    if (!entry) continue;
    if (!entry.isAvailable) { result.unavailable.push(entry); continue; }
    result.matched.push({ entry, quantity, note, explicitQuantity });
  }
  return result;
}
