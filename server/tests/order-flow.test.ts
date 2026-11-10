import test from "node:test";
import assert from "node:assert/strict";
import { handleOrderMessage, normalizePhone, type OrderContext } from "../src/order/orderFlow";
import { isCancelIntent, isOrderIntent, stripOrderIntent } from "../src/order/intent";
import { parseMenuRequest, renderMenu } from "../src/order/menuText";
import { clearSession } from "../src/order/session";
import { testDb } from "./helpers";

let counter = 0;
function chatSetup(ctxExtra: Partial<OrderContext> = {}) {
  const chat = `62811000${String(++counter).padStart(4, "0")}@c.us`;
  clearSession(chat);
  const db = testDb();
  const ctx: OrderContext = { db, ...ctxExtra };
  const say = (text: string): Promise<string> => handleOrderMessage(ctx, chat, text);
  return { db, chat, say, ctx };
}

const orders = (db: ReturnType<typeof testDb>) => db.prepare("SELECT customer_name, phone, total, status, source, fulfillment, table_id FROM orders").all().map((row) => ({ ...row }));
const items = (db: ReturnType<typeof testDb>) => db.prepare("SELECT name, unit_price, quantity, notes FROM order_items ORDER BY rowid").all().map((row) => ({ ...row }));

test("normalizePhone", () => {
  assert.equal(normalizePhone("0812-3456 7890"), "6281234567890");
  assert.equal(normalizePhone("+62 812 3456 7890"), "6281234567890");
  assert.equal(normalizePhone("abc"), null);
  assert.equal(normalizePhone("123"), null);
});

test("niat memesan: kata pesan/order/mau, jumlah+menu; bukan pertanyaan umum", () => {
  const names = ["Americano", "Caffe Latte", "Nasi Goreng"];
  for (const text of ["pesan", "mau pesan", "mau order dong", "pesan 2 latte", "2 americano", "mau americano satu", "pengen nasi goreng", "aku mau pesan 2 latte dan 1 nasi goreng"]) assert.equal(isOrderIntent(text, names), true, text);
  for (const text of ["bisa pesan lewat gofood?", "harga americano berapa?", "ada nasi goreng?", "jam buka?", "cara pesan gimana?", "americano itu apa"]) assert.equal(isOrderIntent(text, names), false, text);
  assert.equal(stripOrderIntent("Halo kak, mau pesan 2 latte dan 1 americano dong"), "2 latte dan 1 americano dong");
  assert.equal(stripOrderIntent("pesan"), "");
  assert.equal(isCancelIntent("batal"), true);
  assert.equal(isCancelIntent("batalin latte"), false);
  assert.equal(isCancelIntent("batal latte"), false);
});

test("permintaan menu dikenali dengan filter kategori", () => {
  assert.deepEqual(parseMenuRequest("menu"), { filter: null });
  assert.deepEqual(parseMenuRequest("menu apa saja?"), { filter: null });
  assert.deepEqual(parseMenuRequest("lihat menu kopi"), { filter: "kopi" });
  assert.deepEqual(parseMenuRequest("ada menu makanan?"), { filter: "makanan" });
  assert.equal(parseMenuRequest("harga americano"), null);
  assert.equal(parseMenuRequest("menu favorit kamu apa ya jelaskan panjang lebar tentang sejarahnya"), null);
});

test("menu dirender dari database: per kategori, yang habis tidak ditawarkan, harga sama dengan DB", () => {
  const db = testDb();
  const text = renderMenu(db);
  assert.match(text, /\*Kopi\*[\s\S]*• Americano - Rp22\.000/);
  assert.match(text, /\*Makanan\*[\s\S]*• Nasi Goreng - Rp35\.000/);
  assert.doesNotMatch(text.split("_Sedang habis")[0] ?? "", /Cheesecake/);
  assert.match(text, /_Sedang habis: Cheesecake_/);
  db.exec("UPDATE menu_items SET data = json_set(data, '$.price', 99000) WHERE id = 'americano'");
  assert.match(renderMenu(db), /Americano - Rp99\.000/);
  assert.match(renderMenu(db, { filter: "makanan" }), /Nasi Goreng/);
  assert.doesNotMatch(renderMenu(db, { filter: "makanan" }), /Americano/);
});

test("pesan pertama langsung memuat banyak item: tercatat tanpa bertanya ulang", async () => {
  const { say } = chatSetup();
  const reply = await say("mau pesan 2 americano, 1 latte dan 1 nasi goreng ya");
  assert.match(reply, /\+ 2x Americano/);
  assert.match(reply, /1\. 2x Americano - Rp44\.000/);
  assert.match(reply, /2\. 1x Caffe Latte - Rp28\.000/);
  assert.match(reply, /3\. 1x Nasi Goreng - Rp35\.000/);
  assert.match(reply, /Total sementara: Rp107\.000/);
  assert.match(reply, /Tips:/);
});

test("edit keranjang: tambah, ganti jumlah, kurangi, hapus, kosongkan, lihat", async () => {
  const { say } = chatSetup();
  await say("pesan 2 americano, 1 latte");
  assert.match(await say("tambah 1 americano"), /Americano[\s\S]*3x|3x Americano/);
  assert.match(await say("ganti latte jadi 4"), /Caffe Latte sekarang 4x/);
  assert.match(await say("kurangi americano 1"), /1x Americano dikurangi/);
  const afterDecrease = await say("keranjang");
  assert.match(afterDecrease, /1\. 2x Americano - Rp44\.000/);
  assert.match(afterDecrease, /2\. 4x Caffe Latte - Rp112\.000/);
  assert.match(await say("hapus latte"), /Caffe Latte dihapus/);
  assert.match(await say("americano jadi 5"), /Americano sekarang 5x/);
  assert.match(await say("jadi 2 americano"), /Americano sekarang 2x/);
  assert.match(await say("hapus pizza"), /tidak ada di daftar/);
  assert.match(await say("hapus nasi goreng"), /belum ada di keranjang/);
  assert.match(await say("kosongkan"), /Keranjang dikosongkan/);
  assert.match(await say("keranjang"), /kosong/i);
});

test("catatan pada item: kurung, dan kata sisa setelah nama menu; typo nama menu ditoleransi", async () => {
  const { say, db } = chatSetup();
  const reply = await say("pesan latte tanpa gula, americanno (es sedikit), nasi goreng pedas");
  assert.match(reply, /1x Caffe Latte[\s\S]*📝 tanpa gula/);
  assert.match(reply, /1x Americano[\s\S]*📝 es sedikit/);
  assert.match(reply, /1x Nasi Goreng[\s\S]*📝 pedas/);
  await say("selesai"); await say("bawa pulang"); await say("Rani"); await say("ya");
  const done = await say("konfirmasi");
  assert.match(done, /Pesanan tersimpan/);
  assert.deepEqual(items(db).map((row) => [row.name, row.notes]), [["Caffe Latte", "tanpa gula"], ["Americano", "es sedikit"], ["Nasi Goreng", "pedas"]]);
});

test("item habis, tidak ada, dan ambigu dijelaskan; yang valid tetap masuk", async () => {
  const { say } = chatSetup();
  const reply = await say("pesan 1 cheesecake, 1 pizza, 2 ca, 1 americano");
  assert.match(reply, /"Cheesecake" sedang habis/);
  assert.match(reply, /Menu "pizza" tidak ada/);
  assert.match(reply, /"ca" cocok dengan beberapa menu/);
  assert.match(reply, /1\. 1x Americano - Rp22\.000/);
});

test("alur lengkap takeaway sampai tersimpan, dibaca ulang sebelum konfirmasi", async () => {
  const { say, db, chat } = chatSetup();
  await say("pesan");
  assert.match(await say("menu"), /Americano/);
  await say("2 americano, 1 nasi goreng");
  assert.match(await say("selesai"), /dine in\) atau bawa pulang/);
  assert.match(await say("bawa pulang"), /nama/i);
  assert.match(await say("Budi"), /628110/);
  const summary = await say("ya");
  assert.match(summary, /Cek lagi pesananmu/);
  assert.match(summary, /1\. 2x Americano - Rp44\.000/);
  assert.match(summary, /Total: Rp79\.000/);
  assert.match(summary, /Tipe: Bawa pulang/);
  assert.match(summary, /Atas nama: Budi/);
  assert.equal(orders(db).length, 0, "belum disimpan sebelum konfirmasi");
  const done = await say("konfirmasi");
  assert.match(done, /Nomor antrian: \*1\*/);
  assert.match(done, /2x Americano - Rp44\.000/);
  assert.match(done, /Total: \*Rp79\.000\*/);
  assert.deepEqual(orders(db), [{ customer_name: "Budi", phone: chat.replace("@c.us", ""), total: 79000, status: "waiting", source: "whatsapp", fulfillment: "takeaway", table_id: null }]);
  assert.deepEqual(items(db), [{ name: "Americano", unit_price: 22000, quantity: 2, notes: "" }, { name: "Nasi Goreng", unit_price: 35000, quantity: 1, notes: "" }]);
});

test("ubah di tahap konfirmasi: kembali ke keranjang, lalu langsung ke ringkasan tanpa mengulang data", async () => {
  const { say, db } = chatSetup();
  await say("pesan 1 americano");
  await say("selesai"); await say("takeaway"); await say("Dewi"); await say("ya");
  assert.match(await say("ubah"), /diubah bagaimana/);
  assert.match(await say("tambah 2 latte"), /\+ 2x Caffe Latte/);
  const summary = await say("selesai");
  assert.match(summary, /Cek lagi pesananmu/);
  assert.match(summary, /2x Caffe Latte - Rp56\.000/);
  assert.match(summary, /Total: Rp78\.000/);
  // perintah ubah langsung di ringkasan juga bisa
  assert.match(await say("hapus americano"), /Americano dihapus[\s\S]*Total: Rp56\.000/);
  assert.match(await say("konfirmasi"), /Pesanan tersimpan/);
  assert.equal(items(db).length, 1);
  assert.equal(orders(db)[0]?.total, 56000);
});

test("konfirmasi juga bisa dengan 'ya/oke'; jawaban lain tidak menyimpan", async () => {
  const { say, db } = chatSetup();
  await say("pesan 1 latte"); await say("selesai"); await say("takeaway"); await say("Dewi"); await say("ya");
  assert.match(await say("hmm bentar"), /Balas \*konfirmasi\*/);
  assert.equal(orders(db).length, 0);
  assert.match(await say("oke"), /Pesanan tersimpan/);
  assert.equal(orders(db).length, 1);
});

test("dine-in menampilkan meja kosong saja, tolak meja terisi, lalu simpan dan meja terisi", async () => {
  const { say, db } = chatSetup();
  await say("pesan 1 latte"); await say("selesai");
  const tables = await say("dine in");
  assert.match(tables, /A1/);
  assert.doesNotMatch(tables, /A2/);
  assert.match(await say("A2"), /tidak ditemukan atau sedang tidak tersedia/);
  assert.match(await say("a1"), /nama/i);
  await say("Sari"); await say("08123456789");
  assert.match(await say("konfirmasi"), /Meja: A1/);
  assert.equal(db.prepare("SELECT status FROM cafe_tables WHERE id='A1'").get()?.status, "occupied");
});

test("tambah item di tengah pilih tipe: keranjang diperbarui lalu pertanyaan tipe diulang", async () => {
  const { say } = chatSetup();
  await say("pesan 1 americano"); await say("selesai");
  const reply = await say("tambah 1 latte");
  assert.match(reply, /2\. 1x Caffe Latte/);
  assert.match(reply, /dine in atau bawa pulang/);
  assert.match(await say("takeaway"), /nama/i); // nama "takeaway"? bukan: lanjut ke nama
});

test("batal membersihkan sesi; menu berubah setelah keranjang dibuat divalidasi ulang", async () => {
  const { say, db } = chatSetup();
  await say("pesan 1 latte, 1 americano"); await say("selesai"); await say("takeaway"); await say("Dewi"); await say("ya");
  db.exec("UPDATE menu_items SET is_available = 0 WHERE id = 'latte'");
  db.exec("UPDATE menu_items SET data = json_set(data, '$.price', 25000) WHERE id = 'americano'");
  const reply = await say("konfirmasi");
  assert.match(reply, /"Caffe Latte" ternyata baru saja habis/);
  assert.match(reply, /Harga Americano berubah: Rp22\.000 -> Rp25\.000/);
  assert.match(reply, /Total: Rp25\.000/);
  assert.equal(orders(db).length, 0, "tidak disimpan sebelum pelanggan melihat perubahan");
  assert.match(await say("konfirmasi"), /Pesanan tersimpan/);
  assert.equal(orders(db)[0]?.total, 25000);
});

test("kata bilangan dan kata pengisi dipahami tanpa AI", async () => {
  const { say } = chatSetup();
  const reply = await say("mau pesan dua americano dong, satu nasi goreng ya kak");
  assert.match(reply, /1\. 2x Americano - Rp44\.000/);
  assert.match(reply, /2\. 1x Nasi Goreng - Rp35\.000/);
  assert.doesNotMatch(reply, /📝/);
});

test("AI ragu/gagal: pelanggan diminta menjelaskan, tidak ada tebakan masuk keranjang", async () => {
  const unsure = chatSetup({ ai: { apiKey: "k", model: "m" }, ask: async () => '{"actions":[],"unclear":"yang gurih itu nasi goreng atau carbonara"}' });
  assert.match(await unsure.say("pesan yang gurih satu"), /belum yakin[\s\S]*yang gurih/);
  assert.match(await unsure.say("keranjang"), /kosong/i);
  const broken = chatSetup({ ai: { apiKey: "k", model: "m" }, ask: async () => { throw new Error("timeout"); } });
  assert.match(await broken.say("pesan sesuatu yang enak"), /Belum ada menu yang cocok|tidak ada di daftar|belum nemu menu/);
});

test("tanpa AI: kalimat tak dikenal tetap ditangani ramah", async () => {
  const { say } = chatSetup();
  assert.match(await say("pesan yang paling enak"), /tidak ada di daftar|Belum ada menu|belum nemu menu/);
});

test("angka tepat setelah nama menu adalah jumlah, sisanya catatan (bukan bagian catatan)", async () => {
  const { say } = chatSetup();
  const reply = await say("pesan latte satu es batunya dikit, nasi goreng 2 pedas banget");
  assert.match(reply, /1\. 1x Caffe Latte - Rp28\.000\n\s+📝 es batunya dikit/);
  assert.match(reply, /2\. 2x Nasi Goreng - Rp70\.000\n\s+📝 pedas banget/);
});

test("AI tidak dipakai untuk hapus/ganti jumlah (hanya parser, tidak ada tebakan)", async () => {
  let called = 0;
  const { say } = chatSetup({ ai: { apiKey: "k", model: "m" }, ask: async () => { called += 1; return '{"actions":[{"op":"remove","id":"americano","qty":null,"conf":"high"}],"unclear":""}'; } });
  await say("pesan 2 americano");
  const reply = await say("hapus yang kemarin");
  assert.equal(called, 0);
  assert.match(reply, /2x Americano/);
});

test("tafsiran AI yang ragu hanya usulan: masuk keranjang HANYA setelah pelanggan menjawab ya", async () => {
  const low = '{"actions":[{"op":"add","id":"nasi-goreng","qty":1,"note":"","conf":"low"}],"unclear":""}';
  const a = chatSetup({ ai: { apiKey: "k", model: "m" }, ask: async () => low });
  const ask = await a.say("pesan yang gurih satu");
  assert.match(ask, /maksudmu \*Nasi Goreng\*\? Balas \*ya\*/);
  assert.match(await a.say("keranjang"), /kosong/i); // belum masuk
  assert.match(await a.say("ya"), /\+ 1x Nasi Goreng[\s\S]*Total sementara: Rp35\.000/);

  const b = chatSetup({ ai: { apiKey: "k", model: "m" }, ask: async () => low });
  await b.say("pesan yang gurih satu");
  const other = await b.say("2 americano"); // jawaban lain = usulan ditolak
  assert.match(other, /1\. 2x Americano/);
  assert.doesNotMatch(other, /Nasi Goreng/);
  assert.doesNotMatch(await b.say("ya"), /Nasi Goreng/);
});

const sureJson = (id: string, qty: number | null, note = "") => JSON.stringify({ actions: [{ op: "add", id, qty, note, conf: "high" }], unclear: "" });

test("AI tanpa nama menu di kalimat: hanya usulan; masuk keranjang setelah 'ya', harga dari DB, id/jumlah karangan dibuang", async () => {
  let prompt = "";
  const { say, db } = chatSetup({
    ai: { apiKey: "k", model: "m" },
    ask: async (_c, messages) => {
      prompt = messages.map((m) => m.content).join("\n");
      return JSON.stringify({ actions: [
        { op: "add", id: "es-kopi-susu", qty: 2, note: "gula dikit", conf: "high" },
        { op: "add", id: "id-ngawur", qty: 5, conf: "high" },
        { op: "add", id: "cheesecake", qty: 1, conf: "high" },
        { op: "add", id: "nasi-goreng", qty: 999, conf: "high" },
      ], unclear: "" });
    },
  });
  const ask = await say("tolong yang gurih sama minuman dingin dua ya");
  assert.match(prompt, /es-kopi-susu \| Es Kopi Susu \| Rp25\.000 \| tersedia/);
  assert.match(ask, /maksudmu \*Es Kopi Susu, Nasi Goreng\*\? Balas \*ya\*/);
  assert.doesNotMatch(ask, /ngawur|Cheesecake/);
  assert.match(await say("keranjang"), /kosong/i);
  const added = await say("ya");
  assert.match(added, /1\. 2x Es Kopi Susu - Rp50\.000/);
  assert.match(added, /📝 gula dikit/);
  assert.match(added, /2\. 1x Nasi Goreng - Rp35\.000/); // 999 tidak disebut pelanggan -> 1
  assert.doesNotMatch(added, /999/);
  await say("selesai"); await say("takeaway"); await say("Tono"); await say("ya"); await say("konfirmasi");
  assert.equal(orders(db)[0]?.total, 85000);
});

test("jumlah dari AI hanya dipercaya bila disebut pelanggan", async () => {
  const { say } = chatSetup({ ai: { apiKey: "k", model: "m" }, ask: async () => sureJson("nasi-goreng", 7) });
  assert.match(await say("pesan 1 americano dan yang berat"), /maksudmu \*Nasi Goreng\*/);
  const added = await say("ya");
  assert.match(added, /2\. 1x Nasi Goreng/);
  assert.doesNotMatch(added, /7x/);
});

test("AI yakin DAN nama menu disebut: langsung masuk dengan keterangan agar bisa dikoreksi", async () => {
  const { say } = chatSetup({ ai: { apiKey: "k", model: "m" }, ask: async () => sureJson("latte", 1, "panas") });
  await say("pesan 1 americano");
  const reply = await say("tambah 1 minuman caffe yang panas");
  assert.match(reply, /\+ 1x Caffe Latte \(panas\)/);
  assert.match(reply, /🤔 Saya mengartikan "minuman caffe yang panas" sebagai Caffe Latte\. Kalau kurang tepat, ketik \*hapus caffe latte\*/);
  assert.match(await say("hapus caffe latte"), /Caffe Latte dihapus/);
});

test("AI melengkapi bagian yang tak terbaca tanpa menimpa yang sudah dipahami parser", async () => {
  const { say } = chatSetup({ ai: { apiKey: "k", model: "m" }, ask: async () => JSON.stringify({ actions: [{ op: "add", id: "americano", qty: 9, conf: "high" }, { op: "add", id: "nasi-goreng", qty: 1, conf: "low" }], unclear: "" }) });
  const reply = await say("pesan 2 americano dan satu yang gurih");
  assert.match(reply, /1\. 2x Americano - Rp44\.000/); // parser menang untuk americano (bukan 9)
  assert.match(reply, /maksudmu \*Nasi Goreng\*/);
});

test("JSON AI rusak dicoba ulang dengan suhu 0; ubah/hapus dari AI yang ragu dibuang", async () => {
  const temps: (number | undefined)[] = [];
  let call = 0;
  const { say } = chatSetup({ ai: { apiKey: "k", model: "m" }, ask: async (_c, _m, options) => {
    temps.push(options?.temperature); call += 1;
    return call === 1 ? '{"actions":[{"op":"add","id":"latte"' : JSON.stringify({ actions: [{ op: "add", id: "latte", qty: 2, note: "", conf: "low" }, { op: "remove", id: "americano", qty: null, conf: "low" }], unclear: "" });
  } });
  await say("pesan 3 americano");
  const reply = await say("tambah dua yang susu-susuan");
  assert.deepEqual(temps, [0, 0]);
  assert.match(reply, /3x Americano/); // remove yang ragu diabaikan
  assert.match(reply, /maksudmu \*Caffe Latte\*/);
});

test("langkah nomor HP: 'nomor ini' dan variasinya memakai nomor WhatsApp pengirim; salah ketik diberi petunjuk", async () => {
  const { handleOrderMessage } = await import("../src/order/orderFlow");
  const { clearSession } = await import("../src/order/session");
  const { testDb: makeDb } = await import("./helpers");
  for (const answer of ["Nomor ini", "nomor ini aja", "yang ini", "ya", "pakai nomor ini", "ini aja kak"]) {
    const chat = "6281999000111@c.us";
    clearSession(chat);
    const ctx = { db: makeDb(), ai: null };
    for (const step of ["pesan 1 americano", "selesai", "bawa pulang", "Budi"]) await handleOrderMessage(ctx, chat, step);
    const reply = await handleOrderMessage(ctx, chat, answer);
    assert.match(reply, /Cek lagi pesananmu/, answer);
    assert.match(reply, /6281999000111/, answer);
    clearSession(chat);
  }
  const chat = "6281999000222@c.us";
  const ctx = { db: makeDb(), ai: null };
  for (const step of ["pesan 1 americano", "selesai", "bawa pulang", "Budi"]) await handleOrderMessage(ctx, chat, step);
  assert.match(await handleOrderMessage(ctx, chat, "A"), /Balas \*ya\* untuk memakai nomor WhatsApp ini \(6281999000222\)/);
  clearSession(chat);
});
