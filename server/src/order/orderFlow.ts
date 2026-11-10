import type { Db } from "../db/database";
import type { AiConfig } from "../config/env";
import type { ChatMessage } from "../ai/types";
import { applyOps, cartTotal, parseCartCommand, renderCart } from "./cart";
import { fetchMenu, looksLikeOrderText, matchCartText, quantitiesIn } from "./menu";
import { formatRupiah, parseMenuRequest, renderMenu } from "./menuText";
import { countTables, fetchAvailableTables } from "./tables";
import { recentOrder, rememberOrder } from "./status";
import { createCafeOrder, OrderError } from "./orderApi";
import { interpretOrder } from "./nlu";
import { isCancelIntent, stripOrderIntent } from "./intent";
import { getSession, startSession, touchSession, clearSession, type OrderSession } from "./session";
import { logger, describeError } from "../whatsapp/logger";
import { hashIdentity } from "../whatsapp/privacy";

export { formatRupiah };

/** Pelanggan langsung menulis item + jumlah ("macha late 1") tanpa kata "pesan": itu juga memulai pesanan. */
export function startsOrderByItems(text: string, menu: ReturnType<typeof fetchMenu>): boolean {
  if (quantitiesIn(text).size === 0) return false;
  const result = matchCartText(stripOrderIntent(text), menu);
  return result.matched.length + result.unavailable.length + result.ambiguous.length > 0 && !text.includes("?");
}

export interface OrderContext {
  db: Db;
  /** Bila ada, kalimat bebas yang tak terbaca parser dibantu AI (hasilnya tetap divalidasi ke database). */
  ai?: AiConfig | null;
  /** Hanya untuk test. */
  ask?: (config: AiConfig, messages: ChatMessage[]) => Promise<string>;
}

const GENERIC_ERROR_REPLY = "Sebentar ya, saya lagi gangguan. Coba lagi.";
const DONE_PHRASES = new Set(["selesai", "udah", "sudah", "cukup", "lanjut", "jadi", "itu aja", "itu saja", "gitu aja", "segitu aja", "udah itu aja", "sudah itu saja", "checkout", "bayar", "lanjut bayar", "next"]);
const YES_PHRASES = new Set(["ya", "iya", "y", "betul", "benar", "ok", "oke", "okay", "sip", "siap", "yup"]);
/** Jawaban "pakai nomor WhatsApp ini" untuk langkah nomor HP. */
const THIS_NUMBER = /^(?:(?:ya|iya|oke|ok|pakai|pake|gunakan)\s+)?(?:(?:nomor|no|nmr)\s+)?(?:yang\s+)?(?:ini|itu|sama)(?:\s+(?:aja|saja|ya|kak|dong|deh))*$|^(?:ya\s+)?(?:nomor|no|nmr)\s+(?:yang\s+)?(?:ini|itu|sama|wa ini|whatsapp ini)(?:\s+(?:aja|saja|ya|kak|dong|deh))*$|^(?:pakai|pake|gunakan)\s+(?:nomor|no)\s+(?:ini|itu)(?:\s+(?:aja|saja|ya))*$/;
const CONFIRM_PHRASES = new Set(["konfirmasi", "ya", "iya", "y", "betul", "benar", "sudah benar", "ok", "oke", "okay", "sip", "siap", "gas", "lanjut", "simpan", "ya benar"]);
const EDIT_PHRASES = new Set(["ubah", "edit", "ubah pesanan", "edit pesanan", "ganti pesanan", "mau ubah", "ralat", "salah"]);
const DINE_IN = ["dine in", "dine-in", "makan di tempat", "di tempat", "makan sini", "disini", "di sini"];
const TAKEAWAY = ["take away", "takeaway", "bawa pulang", "dibungkus", "bungkus", "take-away"];
const TIP = "Tips: ketik *hapus latte*, *ganti americano jadi 3*, atau *tambah 1 cheesecake* kapan saja untuk mengubah pesanan.";

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").replace(/[!.]+$/g, "").trim();
}

/** 0812-xxx -> 62812xxx; hanya angka 8-15 digit yang lolos, selain itu null. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[\s().+-]/g, "");
  if (!/^[0-9]+$/.test(digits)) return null;
  const international = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return /^[0-9]{8,15}$/.test(international) ? international : null;
}

function cartBlock(session: OrderSession): string {
  return `${renderCart(session.cart)}\nTotal sementara: ${formatRupiah(cartTotal(session.cart))}`;
}

function where(session: OrderSession): string {
  return session.fulfillment === "dine_in" ? (session.tableCode ? `Dine in - Meja ${session.tableCode}` : "Dine in (meja diarahkan kasir)") : "Bawa pulang";
}

function confirmationSummary(session: OrderSession): string {
  return [
    "Cek lagi pesananmu ya:",
    renderCart(session.cart),
    `Total: ${formatRupiah(cartTotal(session.cart))} (bayar di kasir / COD)`,
    `Tipe: ${where(session)}`,
    `Atas nama: ${session.customerName} | HP: ${session.phone}`,
    "",
    "Sudah benar? Balas *konfirmasi* untuk menyimpan, *ubah* untuk mengubah pesanan, atau *batal*.",
  ].join("\n");
}

/**
 * Titik masuk alur pesanan. Menangani pesanan baru (termasuk item yang langsung disebut di pesan pertama) dan
 * kelanjutan sesi untuk `chatId`. Selalu mengembalikan teks balasan; semua error ditangkap dan dijawab ramah.
 */
export async function handleOrderMessage(ctx: OrderContext, chatId: string, text: string): Promise<string> {
  try {
    const existing = getSession(chatId);

    if (!existing) {
      const session = startSession(chatId);
      touchSession(chatId);
      const rest = stripOrderIntent(text);
      const previous = recentOrder(chatId);
      const prefix = previous ? `Oke, ini jadi pesanan baru ya (pesanan nomor antrian ${previous.queue} sudah tersimpan).

` : "";
      if (!rest) {
        return `${prefix}Yuk, mau pesan apa hari ini? Tulis menu dan jumlahnya, contoh: "2 americano dan 1 nasi goreng". Ketik *menu* untuk melihat daftar, atau *batal* kapan saja.`;
      }
      const menuRequest = parseMenuRequest(rest);
      if (menuRequest) return `${prefix}${renderMenu(ctx.db, { filter: menuRequest.filter })}`;
      return prefix + await collect(ctx, session, rest);
    }

    touchSession(chatId);
    const session = existing;

    if (isCancelIntent(text)) {
      clearSession(chatId);
      return "Oke, pesanannya dibatalkan ya ☕ Kalau mau pesan lagi, ketik *pesan* kapan saja.";
    }

    const menuRequest = parseMenuRequest(text);
    if (menuRequest) {
      const menu = renderMenu(ctx.db, { filter: menuRequest.filter });
      return session.cart.length ? `${menu}\n\nKeranjangmu saat ini:\n${cartBlock(session)}` : menu;
    }

    switch (session.step) {
      case "collecting_items": {
        const reply = await collect(ctx, session, text);
        if (session.misses >= 2 && session.cart.length === 0) {
          clearSession(chatId);
          return "Sepertinya kamu belum mau pesan sekarang, jadi saya tutup dulu ya ☕ Kalau mau pesan, ketik *pesan* atau langsung tulis menunya, contoh: \"2 americano\". Ketik *menu* untuk melihat daftar.";
        }
        if (session.misses >= 2) return `${reply}

Kalau tidak jadi, ketik *batal*. Kalau pesanannya sudah cukup, ketik *selesai*.`;
        return reply;
      }
      case "awaiting_fulfillment": return await maybeEdit(ctx, session, text) ?? handleAwaitingFulfillment(ctx, session, text);
      case "awaiting_table": return await maybeEdit(ctx, session, text) ?? handleAwaitingTable(ctx, session, text);
      case "awaiting_name": return handleAwaitingName(session, text);
      case "awaiting_phone": return handleAwaitingPhone(session, text);
      case "awaiting_confirmation": return await handleAwaitingConfirmation(ctx, chatId, session, text);
      default: return GENERIC_ERROR_REPLY;
    }
  } catch (error: unknown) {
    logger.error("Order flow gagal karena error tidak terduga.", { identity: hashIdentity(chatId), error: describeError(error) });
    return GENERIC_ERROR_REPLY;
  }
}

/** Setelah item berubah: ke langkah berikutnya, atau langsung ke ringkasan bila data pelanggan sudah terisi. */
function proceedAfterItems(session: OrderSession): string {
  if (session.cart.length === 0) return "Keranjang masih kosong. Sebutkan dulu menu yang mau dipesan ya.";
  if (session.fulfillment && session.customerName && session.phone) {
    session.step = "awaiting_confirmation";
    return confirmationSummary(session);
  }
  session.step = "awaiting_fulfillment";
  return `Oke, keranjang saat ini:\n${cartBlock(session)}\n\nMau makan di tempat (dine in) atau bawa pulang (takeaway)?`;
}

/**
 * Perintah ubah keranjang di tengah alur (hanya yang memakai kata perintah: tambah/hapus/ganti/kurangi/kosongkan/
 * keranjang), supaya jawaban seperti nama pelanggan tidak salah dibaca sebagai menu. null = bukan perintah ubah.
 */
async function maybeEdit(ctx: OrderContext, session: OrderSession, text: string): Promise<string | null> {
  const lower = normalize(text);
  if (EDIT_PHRASES.has(lower)) {
    session.step = "collecting_items";
    return `Boleh, ini keranjangmu:\n${cartBlock(session)}\n\nMau diubah bagaimana? Contoh: *hapus latte*, *ganti americano jadi 3*, *tambah 1 cheesecake*. Ketik *selesai* kalau sudah.`;
  }
  const menu = fetchMenu(ctx.db);
  const parsed = parseCartCommand(text, menu, session.cart);
  if (!parsed.explicit) return null;
  return applyAndReply(ctx, session, parsed, text, menu);
}

async function collect(ctx: OrderContext, session: OrderSession, text: string): Promise<string> {
  const lower = normalize(text);

  if (DONE_PHRASES.has(lower)) return proceedAfterItems(session);
  if (EDIT_PHRASES.has(lower)) return `Ini keranjangmu:\n${session.cart.length ? cartBlock(session) : "(masih kosong)"}\n\nMau diubah bagaimana?`;

  if (!stripOrderIntent(text)) return "Siap! Mau pesan apa? Tulis menu dan jumlahnya, contoh: *2 americano*. Ketik *menu* untuk melihat daftar.";
  const menu = fetchMenu(ctx.db);
  if (session.suggestion) {
    const suggestion = session.suggestion;
    if (YES_PHRASES.has(lower)) {
      session.suggestion = null;
      const notes = applyOps(session.cart, suggestion);
      return `${notes.join("\n")}\n\nKeranjang:\n${cartBlock(session)}\n\nMau tambah lagi? Atau ketik *selesai* kalau sudah cukup.`;
    }
    // Hanya melihat keranjang tidak membatalkan usulan; jawaban lain = usulan ditolak, pesan dibaca apa adanya.
    if (!parseCartCommand(text, menu, session.cart).ops.every((op) => op.op === "view")) session.suggestion = null;
  }
  const parsed = parseCartCommand(text, menu, session.cart);
  return applyAndReply(ctx, session, parsed, text, menu);
}

async function applyAndReply(ctx: OrderContext, session: OrderSession, initial: ReturnType<typeof parseCartCommand>, text: string, menu: ReturnType<typeof fetchMenu>): Promise<string> {
  let parsed = initial;

  // Bagian kalimat yang tak terbaca parser (atau seluruhnya): minta AI memetakannya ke id menu. Hasil parser biasa
  // tetap dipakai; AI hanya menambah item yang BELUM tercakup, setiap id divalidasi ke database, dan:
  // - yakin tinggi -> diterapkan tapi DIBERI KETERANGAN agar pelanggan bisa mengoreksi;
  // - yakin rendah -> hanya usulan: pelanggan harus menjawab "ya" sebelum masuk keranjang.
  const aiNotes: string[] = [];
  if (ctx.ai && (parsed.unrecognized || parsed.problems.some((problem) => problem.startsWith("Menu \""))) && parsed.kind === "add" && normalize(text).length >= 4 && !YES_PHRASES.has(normalize(text)) && looksLikeOrderText(text, menu)) {
    const unresolved = parsed.problems.flatMap((problem) => /^Menu "([^"]+)"/.exec(problem)?.[1] ?? []);
    const phrase = unresolved.length ? unresolved.join(", ") : text;
    const nlu = await interpretOrder({ ai: ctx.ai, ...(ctx.ask ? { ask: ctx.ask } : {}) }, text, menu, session.cart);
    if (nlu) {
      const covered = new Set(parsed.ops.flatMap((op) => ("entry" in op ? [op.entry.id] : [])));
      const fresh = (op: (typeof nlu.ops)[number]): boolean => !("entry" in op) || !covered.has(op.entry.id);
      const accepted = nlu.ops.filter(fresh);
      const suggested = nlu.suggestions.filter(fresh);
      const names = (ops: typeof accepted): string => ops.map((op) => ("entry" in op ? op.entry.name : "")).filter(Boolean).join(", ");
      let problems = parsed.problems;
      if (accepted.length > 0) {
        problems = problems.filter((problem) => !problem.startsWith("Menu \""));
        aiNotes.push(`🤔 Saya mengartikan "${phrase}" sebagai ${names(accepted)}. Kalau kurang tepat, ketik *hapus ${accepted[0] && "entry" in accepted[0] ? accepted[0].entry.name.toLowerCase() : "itu"}*.`);
      }
      if (suggested.length > 0) {
        session.suggestion = suggested;
        problems = problems.filter((problem) => !problem.startsWith("Menu \""));
        aiNotes.push(`🤔 Untuk "${phrase}", maksudmu *${names(suggested)}*? Balas *ya* untuk menambahkan, atau sebutkan menu yang kamu mau.`);
      } else if (nlu.unclear && accepted.length === 0) {
        aiNotes.push(`Saya belum yakin maksud "${nlu.unclear}". Bisa sebutkan nama menunya? Ketik *menu* untuk melihat daftar.`);
      }
      parsed = { ...parsed, ops: [...parsed.ops, ...accepted], problems, unrecognized: false };
    }
  }

  const view = parsed.ops.some((op) => op.op === "view");
  const notes = applyOps(session.cart, parsed.ops.filter((op) => op.op !== "view"));
  const lines = [...notes, ...parsed.problems, ...aiNotes];

  const understood = view || notes.length > 0 || aiNotes.length > 0;
  session.misses = understood ? 0 : session.misses + 1;

  if (lines.length === 0 && !view) {
    return "Belum ada menu yang cocok. Tulis menu dan jumlahnya, misalnya \"2 americano\", atau ketik *menu* untuk melihat daftar.";
  }
  if (!understood && !parsed.ops.length && !looksLikeOrderText(text, menu) && !session.cart.length) {
    return "Hmm, saya belum nemu menu yang kamu maksud 🤔 Tulis nama menu dan jumlahnya (contoh: *2 americano*), atau ketik *menu* untuk melihat daftar. Kalau tidak jadi, ketik *batal*.";
  }

  if (session.cart.length === 0) {
    session.step = "collecting_items";
    return `${lines.join("\n")}\n\nKeranjang masih kosong. Mau pesan apa?`.trim();
  }

  // Sudah di langkah konfirmasi/pilih tipe: tampilkan ulang langkah itu dengan keranjang terbaru.
  if (session.step === "awaiting_confirmation" || (session.step !== "collecting_items" && session.fulfillment && session.customerName && session.phone)) {
    session.step = "awaiting_confirmation";
    return `${lines.join("\n")}\n\n${confirmationSummary(session)}`.trim();
  }
  if (session.step === "awaiting_fulfillment" || session.step === "awaiting_table") {
    return `${lines.join("\n")}\n\nKeranjang sekarang:\n${cartBlock(session)}\n\nLanjut ya: mau dine in atau bawa pulang?`.trim();
  }

  const tip = session.tipShown ? "" : `\n\n${TIP}`;
  session.tipShown = true;
  return `${lines.join("\n")}${lines.length ? "\n\n" : ""}Keranjang:\n${cartBlock(session)}\n\nMau tambah lagi? Atau ketik *selesai* kalau sudah cukup.${tip}`;
}

async function handleAwaitingFulfillment(ctx: OrderContext, session: OrderSession, text: string): Promise<string> {
  const lower = normalize(text);

  if (DINE_IN.some((keyword) => lower.includes(keyword))) {
    const tables = fetchAvailableTables(ctx.db);
    if (tables.length === 0 && countTables(ctx.db) === 0) {
      // Kafe belum mengatur meja di dashboard: makan di tempat tanpa nomor meja, kasir yang mengarahkan.
      session.fulfillment = "dine_in";
      session.tableCode = null;
      session.step = "awaiting_name";
      return "Siap, makan di tempat ya 🍽️ Nomor mejanya nanti diarahkan kasir. Boleh tahu nama untuk pesanan ini?";
    }
    if (tables.length === 0) {
      session.offeredTakeaway = true;
      return "Maaf, semua meja sedang terisi. Mau diganti jadi bawa pulang (takeaway) saja? Balas *ya* untuk bawa pulang.";
    }
    session.fulfillment = "dine_in";
    session.step = "awaiting_table";
    const list = tables.map((table) => `- ${table.id} (${table.label}${table.floorName ? `, ${table.floorName}` : ""})`).join("\n");
    return `Meja yang masih kosong:\n${list}\n\nSilakan sebutkan kode mejanya.`;
  }
  const agreesToTakeaway = session.offeredTakeaway && lower.split(" ").length <= 4 && /\b(?:ya ?udah|yauda|iya|ya|oke|ok|boleh|mau|gas|sip|siap)\b/.test(lower) && !/\b(?:dine|makan|sini|tempat)\b/.test(lower);
  if (agreesToTakeaway || TAKEAWAY.some((keyword) => lower.includes(keyword))) {
    session.offeredTakeaway = false;
    session.fulfillment = "takeaway";
    session.tableCode = null;
    session.step = "awaiting_name";
    return "Baik, dibungkus untuk dibawa pulang. Boleh tahu nama untuk pesanan ini?";
  }
  return "Mau makan di tempat (dine in) atau bawa pulang (takeaway)?";
}

function handleAwaitingTable(ctx: OrderContext, session: OrderSession, text: string): string {
  const tableCode = text.trim();
  const tables = fetchAvailableTables(ctx.db);
  const table = tables.find((candidate) => candidate.id.toLowerCase() === tableCode.toLowerCase());

  if (!table) {
    if (tables.length === 0) {
      session.fulfillment = null;
      session.step = "awaiting_fulfillment";
      return "Maaf, meja itu tidak tersedia dan semua meja lain sudah terisi. Mau diganti jadi bawa pulang (takeaway) saja?";
    }
    return `Meja tidak ditemukan atau sedang tidak tersedia. Pilih salah satu:\n${tables.map((candidate) => `- ${candidate.id} (${candidate.label})`).join("\n")}`;
  }
  session.tableCode = table.id;
  session.step = "awaiting_name";
  return "Boleh tahu nama untuk pesanan ini?";
}

function handleAwaitingName(session: OrderSession, text: string): string {
  const name = text.trim().replace(/^(?:nama(?:ku| saya)?(?: adalah)?|atas nama|a\.?n\.?)\s+/i, "").trim();
  if (name.length < 2 || name.length > 80) return "Nama harus 2-80 karakter. Boleh diulang sebutkan namanya?";
  session.customerName = name;
  session.step = "awaiting_phone";
  return session.suggestedPhone
    ? `Nomor WhatsApp ini (${session.suggestedPhone}) dipakai untuk konfirmasi pesanan? Balas "ya", atau ketik nomor lain.`
    : "Boleh minta nomor WhatsApp/HP-nya untuk konfirmasi pesanan?";
}

function handleAwaitingPhone(session: OrderSession, text: string): string {
  const answer = normalize(text);
  const phone = session.suggestedPhone && (YES_PHRASES.has(answer) || THIS_NUMBER.test(answer)) ? session.suggestedPhone : normalizePhone(text);
  if (!phone) return session.suggestedPhone
    ? `Nomor HP harus berupa angka, 8-15 digit. Balas *ya* untuk memakai nomor WhatsApp ini (${session.suggestedPhone}), atau ketik nomor lain.`
    : "Nomor HP harus berupa angka, 8-15 digit. Boleh diulang?";
  session.phone = phone;
  session.step = "awaiting_confirmation";
  return confirmationSummary(session);
}

/** Cocokkan keranjang dengan menu TERKINI: item yang habis dibuang, harga yang berubah diperbarui. Return catatan perubahan. */
function revalidate(ctx: OrderContext, session: OrderSession): string[] {
  const menu = new Map(fetchMenu(ctx.db).map((entry) => [entry.id, entry]));
  const notes: string[] = [];
  for (const line of [...session.cart]) {
    const entry = menu.get(line.menuItemId);
    if (!entry || !entry.isAvailable) {
      session.cart.splice(session.cart.indexOf(line), 1);
      notes.push(`"${line.name}" ternyata baru saja habis, jadi saya keluarkan dari pesanan.`);
    } else if (entry.price !== line.price) {
      notes.push(`Harga ${line.name} berubah: ${formatRupiah(line.price)} -> ${formatRupiah(entry.price)}.`);
      line.price = entry.price;
    }
  }
  return notes;
}

async function handleAwaitingConfirmation(ctx: OrderContext, chatId: string, session: OrderSession, text: string): Promise<string> {
  const lower = normalize(text);

  if (EDIT_PHRASES.has(lower)) {
    session.step = "collecting_items";
    return `Boleh, ini keranjangmu:\n${cartBlock(session)}\n\nMau diubah bagaimana? Contoh: *hapus latte*, *ganti americano jadi 3*, *tambah 1 cheesecake*. Ketik *selesai* kalau sudah.`;
  }
  const edited = await maybeEdit(ctx, session, text);
  if (edited !== null) return edited;

  if (!CONFIRM_PHRASES.has(lower)) return `Balas *konfirmasi* untuk menyimpan pesanan, *ubah* untuk mengubah, atau *batal*.\n\n${confirmationSummary(session)}`;
  if (!session.fulfillment || !session.customerName || !session.phone) return GENERIC_ERROR_REPLY;

  const changes = revalidate(ctx, session);
  if (changes.length > 0) {
    if (session.cart.length === 0) { session.step = "collecting_items"; return `${changes.join("\n")}\n\nKeranjang jadi kosong. Mau pesan menu lain?`; }
    return `${changes.join("\n")}\n\nJadi begini ya, silakan cek lagi:\n${confirmationSummary(session)}`;
  }

  let order;
  try {
    order = createCafeOrder(ctx.db, {
      idempotencyKey: session.idempotencyKey,
      customerName: session.customerName,
      phone: session.phone,
      fulfillment: session.fulfillment,
      tableCode: session.tableCode,
      cart: session.cart,
    });
  } catch (error: unknown) {
    logger.error("Gagal membuat pesanan.", { identity: hashIdentity(chatId), error: describeError(error) });
    // Hanya OrderError (pesan bisnis berbahasa Indonesia) yang boleh dilihat pelanggan.
    if (error instanceof OrderError) {
      if (/meja/i.test(error.message)) { session.fulfillment = null; session.tableCode = null; session.step = "awaiting_fulfillment"; return `Maaf, ${error.message}\nMau pilih meja lain atau bawa pulang?`; }
      if (/menu/i.test(error.message)) { session.step = "collecting_items"; return `Maaf, ${error.message}\n\nKeranjangmu:\n${cartBlock(session)}`; }
      return `Maaf, pesanan belum bisa diproses: ${error.message}`;
    }
    return GENERIC_ERROR_REPLY;
  }

  clearSession(chatId);
  rememberOrder(chatId, order);
  const noteOf = (index: number): string => (session.cart[index]?.notes ? `\n    📝 ${session.cart[index]?.notes}` : "");
  return [
    "Pesanan tersimpan! 🎉",
    `Nomor antrian: *${order.queue_number}*`,
    ...order.items.map((item, index) => `• ${item.quantity}x ${item.name} - ${formatRupiah(item.unit_price * item.quantity)}${noteOf(index)}`),
    `Total: *${formatRupiah(order.total)}* - bayar di kasir (COD).`,
    order.table_id ? `Meja: ${order.table_id}` : order.fulfillment === "dine_in" ? "Silakan duduk dulu, kasir akan mengarahkan mejanya." : "Silakan ambil di kasir saat sudah siap.",
    "",
    "Terima kasih sudah pesan di CafeSite ☕",
    "Ketik *status* untuk cek pesananmu, atau *pesan* kalau mau pesan lagi.",
  ].join("\n");
}
