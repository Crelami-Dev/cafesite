import { matchCartText, type MenuEntry } from "./menu";
import { formatRupiah } from "./menuText";
import type { CartLine } from "./session";

export type CartOp =
  | { op: "add"; entry: MenuEntry; quantity: number; note: string }
  | { op: "set"; entry: MenuEntry; quantity: number }
  | { op: "remove"; entry: MenuEntry; quantity: number | null }
  | { op: "clear" }
  | { op: "view" };

export interface ParsedCommand {
  ops: CartOp[];
  /** Pesan untuk bagian yang tidak bisa diproses (habis, ambigu, tidak ditemukan). */
  problems: string[];
  /** True bila pelanggan memakai kata perintah (tambah/hapus/ganti/...), bukan sekadar menyebut menu. */
  explicit: boolean;
  /** "add" = menambah item (termasuk tanpa kata perintah); "edit" = ubah/hapus/kosongkan/lihat. AI hanya membantu pada "add". */
  kind: "add" | "edit";
  /** True bila sama sekali tidak ada menu yang dikenali (kandidat untuk dibantu AI). */
  unrecognized: boolean;
}

const MAX_LINE_QUANTITY = 20;
const MAX_PORTIONS = 100;
export const MAX_LINES = 30;

export function cartTotal(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

export function portions(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + line.quantity, 0);
}

export function renderCart(cart: CartLine[]): string {
  return cart
    .map((line, index) => `${index + 1}. ${line.quantity}x ${line.name} - ${formatRupiah(line.price * line.quantity)}${line.notes ? `\n    📝 ${line.notes}` : ""}`)
    .join("\n");
}

function problemsOf(result: ReturnType<typeof matchCartText>): string[] {
  const problems: string[] = [];
  for (const entry of result.unavailable) problems.push(`Maaf, "${entry.name}" sedang habis. Mau coba menu lain?`);
  for (const { query, candidates } of result.ambiguous) problems.push(`"${query}" cocok dengan beberapa menu, yang mana?\n${candidates.map((candidate) => `- ${candidate.name}`).join("\n")}`);
  for (const query of result.notFound) problems.push(`Menu "${query}" tidak ada di daftar kami. Ketik "menu" untuk melihat pilihan.`);
  return problems;
}

const VIEW = /^(?:keranjang|lihat (?:pesanan|keranjang)|liat (?:pesanan|keranjang)|cek (?:pesanan|keranjang)|pesanan (?:saya|ku|aku)|isi keranjang|rekap(?:an)?)(?: saya| ku)?$/;
const CLEAR = /^(?:kosongkan|kosongin|reset|hapus semua|hapus semuanya|ulang dari awal)(?: keranjang| pesanan)?$/;
const REMOVE = /^(?:hapus|buang|hilangkan|batalin|batalkan|cancel|gak jadi|nggak jadi|ga jadi|tidak jadi|tak jadi|keluarkan)\s+(.+)$/;
const DECREASE = /^(?:kurangi|kurangin|kurang|minus)\s+(.+)$/;
const ADD = /^(?:tambah|tambahin|tambahkan|nambah|plus|\+)\s*(.+)$/;
const SET_A = /^(?:ganti|ubah|edit|ubah jumlah|ganti jumlah|jadikan|jadiin)\s+(.+?)\s+(?:jadi|menjadi|ke)\s+(\d{1,2})(?:\s*(?:x|buah|porsi|gelas))?$/;
const SET_B = /^(.+?)\s+(?:jadi|menjadi)\s+(\d{1,2})(?:\s*(?:x|buah|porsi|gelas))?$/;
const SET_C = /^(?:jadi|menjadi|jadikan|jadiin)\s+(\d{1,2})\s*(?:x|buah|porsi|gelas)?\s+(.+)$/;

/**
 * Terjemahkan satu pesan pelanggan menjadi operasi keranjang. Tanpa kata perintah, pesan dianggap menambah.
 * Contoh: "2 latte, 1 nasi goreng" (tambah), "hapus latte", "kurangi americano 1", "ganti latte jadi 3",
 * "latte jadi 3", "tambah 1 cheesecake", "kosongkan", "keranjang".
 */
export function parseCartCommand(text: string, menu: MenuEntry[], cart: CartLine[]): ParsedCommand {
  const lower = text.toLowerCase().replace(/\s+/g, " ").replace(/[!?.]+$/g, "").trim();
  const done = (ops: CartOp[], problems: string[], explicit: boolean, unrecognized = false, kind: ParsedCommand["kind"] = "edit"): ParsedCommand => ({ ops, problems, explicit, unrecognized, kind });

  if (VIEW.test(lower)) return done([{ op: "view" }], [], true);
  if (CLEAR.test(lower)) return done([{ op: "clear" }], [], true);

  const target = (query: string): ReturnType<typeof matchCartText> => matchCartText(query, menuForEdit(menu, cart));

  const setMatch = SET_A.exec(lower) ?? SET_B.exec(lower);
  if (setMatch?.[1] && setMatch[2] && !/^\d+$/.test(setMatch[1])) {
    const result = target(setMatch[1]);
    const quantity = Number(setMatch[2]);
    return done(result.matched.map((line) => ({ op: "set", entry: line.entry, quantity })), problemsOf(result), true, result.matched.length === 0 && problemsOf(result).length === result.notFound.length && result.notFound.length > 0);
  }
  const setC = SET_C.exec(lower);
  if (setC?.[1] && setC[2]) {
    const result = target(setC[2]);
    return done(result.matched.map((line) => ({ op: "set", entry: line.entry, quantity: Number(setC[1]) })), problemsOf(result), true);
  }

  const bare = /^(hapus|buang|batalin|kurangi|kurangin|ganti|ubah|edit|tambah|tambahin|tambahkan|nambah)$/.exec(lower);
  if (bare?.[1]) {
    if (cart.length === 0) return done([], ["Keranjang masih kosong. Tulis menu yang mau dipesan, contoh: 2 americano."], true);
    const verb = bare[1];
    const hint = /^(hapus|buang|batalin)$/.test(verb) ? "Mau hapus yang mana? Ketik *hapus 2* (sesuai nomor di keranjang) atau *hapus latte*."
      : /^kurang/.test(verb) ? "Mau kurangi yang mana? Contoh: *kurangi americano 1*."
      : /^(ganti|ubah|edit)$/.test(verb) ? "Mau ganti yang mana? Contoh: *ganti americano jadi 3*."
      : "Mau tambah apa? Contoh: *tambah 1 cheesecake*. Ketik *menu* untuk melihat daftar.";
    return done([], [hint], true);
  }
  const byNumber = /^(?:hapus|buang|batalin|batalkan|keluarkan)\s+(?:no\.?\s*|nomor\s*)?(\d{1,2})$/.exec(lower);
  if (byNumber?.[1]) {
    const line = cart[Number(byNumber[1]) - 1];
    const entry = line ? menu.find((candidate) => candidate.id === line.menuItemId) : undefined;
    if (!line || !entry) return done([], [`Nomor ${byNumber[1]} tidak ada di keranjang.`], true);
    return done([{ op: "remove", entry, quantity: null }], [], true);
  }
  const remove = REMOVE.exec(lower);
  if (remove?.[1]) {
    const result = target(remove[1]);
    return done(result.matched.map((line) => ({ op: "remove", entry: line.entry, quantity: line.explicitQuantity ? line.quantity : null })), problemsOf(result), true);
  }
  const decrease = DECREASE.exec(lower);
  if (decrease?.[1]) {
    const result = target(decrease[1]);
    return done(result.matched.map((line) => ({ op: "remove", entry: line.entry, quantity: line.explicitQuantity ? line.quantity : 1 })), problemsOf(result), true);
  }

  const add = ADD.exec(lower);
  const body = add?.[1] ?? text;
  const result = matchCartText(body, menu);
  const problems = problemsOf(result);
  return done(
    result.matched.map((line) => ({ op: "add", entry: line.entry, quantity: line.quantity, note: line.note })),
    problems,
    Boolean(add),
    result.matched.length === 0 && result.unavailable.length === 0 && result.ambiguous.length === 0,
    "add",
  );
}

/** Untuk hapus/ubah, hanya item yang ada di keranjang yang relevan; bila tidak ada yang cocok, cari di seluruh menu agar pesan galatnya jelas. */
function menuForEdit(menu: MenuEntry[], cart: CartLine[]): MenuEntry[] {
  const inCart = menu.filter((entry) => cart.some((line) => line.menuItemId === entry.id));
  return inCart.length > 0 ? [...inCart, ...menu.filter((entry) => !inCart.includes(entry))] : menu;
}

function findLine(cart: CartLine[], entry: MenuEntry): CartLine[] {
  return cart.filter((line) => line.menuItemId === entry.id);
}

/** Terapkan operasi ke keranjang (mengubahnya) dan kembalikan kalimat ringkas tentang apa yang terjadi. */
export function applyOps(cart: CartLine[], ops: CartOp[]): string[] {
  const notes: string[] = [];
  for (const op of ops) {
    if (op.op === "add") {
      const existing = cart.find((line) => line.menuItemId === op.entry.id && line.notes === op.note);
      if (!existing && cart.length >= MAX_LINES) { notes.push("Pesanan sudah mencapai batas jenis menu. Hubungi kasir untuk pesanan lebih besar."); continue; }
      const room = MAX_PORTIONS - portions(cart);
      if (room <= 0) { notes.push("Pesanan sudah mencapai 100 porsi. Hubungi kasir untuk pesanan lebih besar."); continue; }
      const wanted = Math.min(op.quantity, room);
      if (existing) existing.quantity = Math.min(MAX_LINE_QUANTITY, existing.quantity + wanted);
      else cart.push({ menuItemId: op.entry.id, name: op.entry.name, price: op.entry.price, quantity: Math.min(MAX_LINE_QUANTITY, wanted), notes: op.note });
      notes.push(`+ ${wanted}x ${op.entry.name}${op.note ? ` (${op.note})` : ""}`);
    } else if (op.op === "set") {
      const lines = findLine(cart, op.entry);
      if (lines.length === 0) { notes.push(`"${op.entry.name}" belum ada di keranjang, jadi saya tambahkan ${op.quantity}x.`); cart.push({ menuItemId: op.entry.id, name: op.entry.name, price: op.entry.price, quantity: Math.min(MAX_LINE_QUANTITY, op.quantity), notes: "" }); continue; }
      const first = lines[0];
      if (!first) continue;
      for (const extra of lines.slice(1)) cart.splice(cart.indexOf(extra), 1);
      first.quantity = Math.min(MAX_LINE_QUANTITY, op.quantity);
      notes.push(`${op.entry.name} sekarang ${first.quantity}x`);
    } else if (op.op === "remove") {
      const lines = findLine(cart, op.entry);
      if (lines.length === 0) { notes.push(`"${op.entry.name}" memang belum ada di keranjang.`); continue; }
      if (op.quantity === null) { for (const line of lines) cart.splice(cart.indexOf(line), 1); notes.push(`- ${op.entry.name} dihapus`); continue; }
      let left = op.quantity;
      for (const line of lines) {
        const take = Math.min(left, line.quantity);
        line.quantity -= take; left -= take;
        if (line.quantity === 0) cart.splice(cart.indexOf(line), 1);
        if (left === 0) break;
      }
      notes.push(`- ${op.quantity - left}x ${op.entry.name} dikurangi`);
    } else if (op.op === "clear") {
      cart.length = 0;
      notes.push("Keranjang dikosongkan.");
    }
  }
  return notes;
}
