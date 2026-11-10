const fs = require("fs");
const R = String.raw;
function edit(file, pairs) {
  let s = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  for (const [from, to] of pairs) {
    if (!s.includes(from)) throw new Error(`tidak ketemu di ${file}: ${from.slice(0, 70)}`);
    s = s.replace(from, to);
  }
  fs.writeFileSync(file, s);
}
// dashboard label
edit("src/components/admin/orders/order-format.ts", [[R`return order.fulfillment === "dine_in" ? ${"`"}Meja ${"$"}{order.table_id ?? "-"}${"`"} : "Bawa pulang";`, R`return order.fulfillment === "dine_in" ? (order.table_id ? ${"`"}Meja ${"$"}{order.table_id}${"`"} : "Makan di tempat") : "Bawa pulang";`]]);

// tables.ts: hitung semua meja
edit("server/src/order/tables.ts", [["/** Meja berstatus", "/** Jumlah meja yang diatur di dashboard (berapa pun statusnya). 0 = kafe belum memakai pengaturan meja. */\nexport function countTables(db: Db): number {\n  return Number(db.prepare(\"SELECT COUNT(*) AS n FROM cafe_tables\").get()?.n ?? 0);\n}\n\n/** Meja berstatus"]]);

// orderApi: dine-in tanpa meja bila kafe tidak mengatur meja
edit("server/src/order/orderApi.ts", [[`    if (input.fulfillment === "dine_in") {
      const table = db.prepare("SELECT id, status FROM cafe_tables WHERE id = ?").get(input.tableCode ?? "");
      if (!table || table.status !== "available") throw new OrderError("Meja tidak tersedia. Hubungi kasir atau pilih meja lain.");
      tableId = String(table.id);
    }`, `    if (input.fulfillment === "dine_in") {
      const configured = Number(db.prepare("SELECT COUNT(*) AS n FROM cafe_tables").get()?.n ?? 0);
      // Kafe yang belum mengatur meja di dashboard: makan di tempat tanpa nomor meja (kasir yang mengarahkan).
      if (configured > 0 || input.tableCode) {
        const table = db.prepare("SELECT id, status FROM cafe_tables WHERE id = ?").get(input.tableCode ?? "");
        if (!table || table.status !== "available") throw new OrderError("Meja tidak tersedia. Hubungi kasir atau pilih meja lain.");
        tableId = String(table.id);
      }
    }`]]);

// session: field baru
edit("server/src/order/session.ts", [["  /** Petunjuk cara mengubah", "  /** Berapa pesan berturut-turut yang tidak dipahami sebagai pesanan (untuk keluar dari mode pesan dengan ramah). */\n  misses: number;\n  /** Bot baru saja menawarkan takeaway karena meja penuh; \"ya/yaudah\" berarti setuju. */\n  offeredTakeaway: boolean;\n  /** Petunjuk cara mengubah"], ["    suggestion: null,\n", "    suggestion: null,\n    misses: 0,\n    offeredTakeaway: false,\n"]]);

// intent: tambah/nambah sebagai pembuka pesanan baru
edit("server/src/order/intent.ts", [[R`const VERB_START = /^(?:pesan(?:an)?|pesen|order|beli|mau pesan|mau pesen)\b/;`, R`const VERB_START = /^(?:pesan(?:an)?|pesen|order|beli|mau pesan|mau pesen|tambah(?:in|kan)?|nambah)\b/;`]]);
