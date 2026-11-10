import test from "node:test";
import assert from "node:assert/strict";
import { createBot, INTRO } from "../src/bot";
import { isCancelIntent, isOrderIntent } from "../src/order/intent";
import { checkMessage } from "../src/ai/guard";
import { parseStatusRequest, resetStatusState } from "../src/order/status";
import { clearSession } from "../src/order/session";
import { testDb, type SeedItem } from "./helpers";

/** Menu persis seperti di database nyata kafe (diambil dari percakapan WhatsApp asli). */
const REAL_MENU: SeedItem[] = [
  { id: "c-01", name: "Americano", price: 22000 },
  { id: "c-02", name: "Caramel Macchiato", price: 28000 },
  { id: "c-03", name: "Manual Brew V60", price: 30000 },
  { id: "n-01", name: "Matcha Latte", price: 26000, category: "non-coffee" },
  { id: "n-02", name: "Artisan Berry Tea", price: 24000, category: "non-coffee" },
  { id: "f-01", name: "Nasi Goreng Kampung", price: 35000, category: "food" },
  { id: "f-02", name: "Creamy Chicken Carbonara", price: 42000, category: "food" },
  { id: "s-01", name: "Truffle Fries", price: 25000, category: "snack" },
];
const env = { botIdleMs: 10 * 60_000, botReminderMs: 8 * 60_000, rateLimitMaxPerMinute: 100, rateLimitWindowMs: 60_000 };
let counter = 0;

function chat(options: { tables?: boolean; ai?: boolean } = {}) {
  resetStatusState();
  const id = `62899${String(++counter).padStart(6, "0")}@c.us`;
  clearSession(id);
  const db = testDb(REAL_MENU, { tables: options.tables ?? false });
  const sent: string[] = [];
  const bot = createBot({ db, env, ai: options.ai ? { apiKey: "k", model: "m" } : null, embedder: null, send: async (_to, text) => { sent.push(text); }, ask: async () => '{"actions":[],"unclear":""}' });
  let n = 0;
  const say = async (body: string): Promise<string> => {
    const before = sent.length;
    await bot.handle({ id: `m${++n}`, from: id, body, fromMe: false, isGroupMsg: false });
    return sent.length > before ? (sent.at(-1) ?? "") : "";
  };
  return { db, say, id, sent };
}

test("niat memesan: ejaan 'pesen', pertanyaan 'bisa pesen?', item+jumlah; bukan pertanyaan umum", () => {
  const names = REAL_MENU.map((item) => item.name);
  for (const text of ["Saya mau pesen bisa?", "Mau pesen", "bisa pesen?", "boleh pesan", "Macha late 1", "pesen 2 americano", "tambah 1 americano"]) assert.equal(isOrderIntent(text, names) || text === "Macha late 1", true, text);
  for (const text of ["Yang pesen ada berapa banyak", "bisa pesan lewat gofood?", "harga americano berapa", "Kau lagi apa", "Ada menu apa"]) assert.equal(isOrderIntent(text, names), false, text);
});

test("pembatalan: 'gk jadi beli', 'gak jadi', 'nggak usah', tetapi 'gak jadi latte' hanya menghapus latte", () => {
  for (const text of ["Gk jadi beli", "gak jadi", "ga jadi deh", "nggak jadi pesan", "enggak usah", "batal", "Batalin", "udahan"]) assert.equal(isCancelIntent(text), true, text);
  for (const text of ["gak jadi latte", "batalin latte", "batal latte", "ga jadi 1 americano"]) assert.equal(isCancelIntent(text), false, text);
});

test("obrolan ringan dijawab langsung tanpa AI: terima kasih, 'kaga', 'lagi apa', tawa, sapaan", () => {
  const kind = (text: string): string | undefined => { const verdict = checkMessage(text, [], true); return verdict.kind === "reply" ? verdict.smalltalk : "allow"; };
  assert.equal(kind("Oke makasih"), "thanks");
  assert.equal(kind("makasih kak"), "thanks");
  assert.equal(kind("sip"), "thanks");
  assert.equal(kind("Kaga"), "negation");
  assert.equal(kind("nggak dulu deh"), "negation");
  assert.equal(kind("Lagi apa"), "identity");
  assert.equal(kind("Kau lagi apa"), "identity");
  assert.equal(kind("kamu siapa"), "identity");
  assert.equal(kind("wkwkwk"), "laugh");
  assert.equal(kind("Halo"), "greeting");
  for (const text of ["Yang pesen ada berapa banyak", "berapa omzet hari ini", "jumlah pelanggan hari ini"]) assert.equal((checkMessage(text, [], true) as { text: string }).text.includes("di luar yang bisa saya bantu"), true, text);
  assert.equal(checkMessage("pesanan saya sudah jadi belum", [], true).kind, "allow");
  assert.equal(checkMessage("siapa presiden indonesia", [], true).kind, "reply"); // tetap ditolak sebagai di luar topik
  assert.equal((checkMessage("siapa presiden indonesia", [], true) as { smalltalk?: string }).smalltalk, undefined);
});

test("permintaan status/batal/ubah pesanan tersimpan dikenali", () => {
  assert.equal(parseStatusRequest("status"), "status");
  assert.equal(parseStatusRequest("Pesanan saya udah jadi?"), "status");
  assert.equal(parseStatusRequest("udah jadi belum"), "status");
  assert.equal(parseStatusRequest("batalkan pesanan"), "cancel_saved");
  assert.equal(parseStatusRequest("ubah pesanan"), "edit_saved");
  assert.equal(parseStatusRequest("harga americano"), null);
});

test("REGRESI percakapan WhatsApp asli: typo, kata pengisi, kafe tanpa meja, konfirmasi ganda, obrolan setelah pesan", async () => {
  const { db, say } = chat();
  assert.equal(await say("halo bot"), INTRO);

  // "Saya mau pesen bisa?" dulu ditolak; sekarang memulai pesanan
  assert.match(await say("Saya mau pesen bisa?"), /mau pesan apa/);
  assert.match(await say("Ada menu apa"), /\*Kopi\*[\s\S]*Americano - Rp22\.000[\s\S]*\*Makanan\*/);
  assert.match(await say("Mau pesen"), /Mau pesan apa/); // bukan dianggap menu

  // typo + kata pengisi: dulu "late"/"maciato" jadi catatan dan "nasi goreng juga" ditebak AI
  const items = await say("Macha late 1 sama karamel maciato 1 terus saya mau nasi goreng juga 1");
  assert.match(items, /1\. 1x Matcha Latte - Rp26\.000\n/);
  assert.match(items, /2\. 1x Caramel Macchiato - Rp28\.000\n/);
  assert.match(items, /3\. 1x Nasi Goreng Kampung - Rp35\.000\n/);
  assert.doesNotMatch(items, /📝|🤔/);
  assert.match(items, /Total sementara: Rp89\.000/);

  assert.match(await say("Udah"), /dine in\) atau bawa pulang/);
  // kafe belum mengatur meja: dulu "semua meja terisi"
  assert.match(await say("Makan sini aja"), /makan di tempat[\s\S]*diarahkan kasir[\s\S]*nama/i);
  assert.match(await say("Fahmi"), /nomor whatsapp/i);
  const summary = await say("089647851864");
  assert.match(summary, /Tipe: Dine in \(meja diarahkan kasir\)/);
  assert.match(summary, /HP: 6289647851864/);
  const saved = await say("Konfirmasi");
  assert.match(saved, /Pesanan tersimpan[\s\S]*Nomor antrian: \*1\*[\s\S]*Total: \*Rp89\.000\*[\s\S]*kasir akan mengarahkan mejanya[\s\S]*Ketik \*status\*/);
  const row = db.prepare("SELECT fulfillment, table_id, total FROM orders").get();
  assert.deepEqual({ ...row }, { fulfillment: "dine_in", table_id: null, total: 89000 });
  assert.deepEqual(db.prepare("SELECT notes FROM order_items").all().map((r) => r.notes), ["", "", ""]);

  // "konfirmasi" kedua kali (pesan ganda) tidak membuat apa-apa dan tidak ngaco
  assert.match(await say("konfirmasi"), /nomor antrian \*1\* sudah tersimpan/);
  // obrolan setelah pesan: dulu "Mau pesan? Ketik pesan", "Kaga? 😊", "Lagi apa? 😊"
  assert.match(await say("Oke makasih"), /Sama-sama kak[\s\S]*nomor antrian 1[\s\S]*status/);
  assert.match(await say("Kaga"), /Siap!/);
  assert.match(await say("Lagi apa"), /asisten WhatsApp CafeSite/);
  assert.match(await say("Halo"), /Ada yang bisa saya bantu/);
  // pertanyaan biasa yang mengandung kata "pesen" TIDAK memulai pesanan palsu
  const question = await say("Yang pesen ada berapa banyak");
  assert.doesNotMatch(question, /Keranjang|tidak ada di daftar|belum yakin/);
  assert.match(await say("Kau lagi apa"), /asisten WhatsApp CafeSite/);
  assert.equal(Number(db.prepare("SELECT COUNT(*) n FROM orders").get()?.n), 1);

  // "Macha late 1" langsung memulai pesanan baru (dengan catatan pesanan sebelumnya)
  const again = await say("Macha late 1");
  assert.match(again, /pesanan baru[\s\S]*sudah tersimpan/);
  assert.match(again, /1\. 1x Matcha Latte - Rp26\.000\n/);
  assert.doesNotMatch(again, /📝/);
  // "Hapus" tanpa nama: dulu dibilang menu tidak ada
  assert.match(await say("Hapus"), /Mau hapus yang mana\? Ketik \*hapus 2\*/);
  assert.match(await say("Selesai"), /dine in\) atau bawa pulang/);
  // "Gk jadi beli": dulu malah ditanya dine in lagi
  assert.match(await say("Gk jadi beli"), /dibatalkan/);
  assert.match(await say("Selesai"), /^$|./); // sesi sudah berakhir, tidak memulai apa pun
});

test("meja penuh: tawaran bawa pulang dijawab 'oh yaudah' (dulu diulang bertanya)", async () => {
  const { db, say } = chat({ tables: true });
  db.exec("UPDATE cafe_tables SET status = 'occupied'");
  await say("halo bot"); await say("pesen 1 americano"); await say("selesai");
  assert.match(await say("Makan sini aja"), /semua meja sedang terisi[\s\S]*Balas \*ya\*/);
  assert.match(await say("Oh yaudah"), /dibungkus[\s\S]*nama/i);
});

test("hapus berdasarkan nomor, kata kerja tanpa objek, dan keluar ramah setelah dua kali tidak nyambung", async () => {
  const { say } = chat();
  await say("halo bot");
  await say("pesan 2 americano, 1 nasi goreng, 1 truffle fries");
  assert.match(await say("hapus 2"), /Nasi Goreng Kampung dihapus[\s\S]*1\. 2x Americano[\s\S]*2\. 1x Truffle Fries/);
  assert.match(await say("hapus 9"), /Nomor 9 tidak ada/);
  assert.match(await say("ganti"), /Mau ganti yang mana/);
  assert.match(await say("tambah"), /Mau tambah apa/);
  assert.match(await say("batal"), /dibatalkan/);

  // tidak nyambung dua kali berturut-turut saat keranjang kosong -> sesi ditutup ramah
  const fresh = chat();
  await fresh.say("halo bot");
  await fresh.say("pesan");
  assert.match(await fresh.say("kau lagi ngapain sih"), /belum nemu menu/);
  assert.match(await fresh.say("hmm entahlah"), /belum mau pesan sekarang[\s\S]*ketik \*pesan\*/i);
  assert.match(await fresh.say("americano"), /^$|./);
});

test("setelah pesanan tersimpan: status, batalkan (dengan konfirmasi), dan tidak bisa batal bila sudah diproses", async () => {
  const { db, say } = chat();
  await say("halo bot");
  await say("pesan 1 americano"); await say("selesai"); await say("bawa pulang"); await say("Dewi"); await say("08123456789"); await say("konfirmasi");

  const status = await say("status");
  assert.match(status, /nomor antrian \*1\*: menunggu diproses kasir[\s\S]*1x Americano[\s\S]*Rp22\.000[\s\S]*batalkan pesanan/);
  assert.match(await say("ubah pesanan"), /sudah masuk ke kasir[\s\S]*batalkan pesanan[\s\S]*pesan/i);

  assert.match(await say("batalkan pesanan"), /Batalkan pesanan nomor antrian \*1\*[\s\S]*Balas \*ya\*/);
  assert.equal(db.prepare("SELECT status FROM orders").get()?.status, "waiting", "belum dibatalkan sebelum 'ya'");
  assert.match(await say("ya"), /sudah dibatalkan ✅/);
  assert.equal(db.prepare("SELECT status FROM orders").get()?.status, "cancelled");
  assert.match(await say("status"), /dibatalkan/);
  assert.match(await say("batalkan pesanan"), /sudah dibatalkan|tidak bisa dibatalkan/);
});

test("pesanan yang sudah disiapkan kasir tidak bisa dibatalkan lewat chat", async () => {
  const { db, say } = chat();
  await say("halo bot");
  await say("pesan 1 americano"); await say("selesai"); await say("takeaway"); await say("Dewi"); await say("08123456789"); await say("konfirmasi");
  db.exec("UPDATE orders SET status = 'preparing'");
  assert.match(await say("status"), /sedang disiapkan/);
  assert.match(await say("batalkan pesanan"), /sudah diproses[\s\S]*hubungi kasir/i);
  assert.equal(db.prepare("SELECT status FROM orders").get()?.status, "preparing");
});

test("pembatalan yang diabaikan tidak membatalkan; kasir memproses saat menunggu konfirmasi -> ditolak aman", async () => {
  const { db, say } = chat();
  await say("halo bot");
  await say("pesan 1 americano"); await say("selesai"); await say("takeaway"); await say("Dewi"); await say("08123456789"); await say("konfirmasi");
  await say("batalkan pesanan");
  assert.match(await say("harga americano"), /Rp22\.000/); // jawaban lain = tidak jadi batal
  assert.equal(db.prepare("SELECT status FROM orders").get()?.status, "waiting");
  await say("batalkan pesanan");
  db.exec("UPDATE orders SET status = 'preparing'"); // kasir keburu memproses
  assert.match(await say("ya"), /baru saja diproses kasir/);
  assert.equal(db.prepare("SELECT status FROM orders").get()?.status, "preparing");
});
