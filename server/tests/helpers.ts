import { openDatabase, type Db } from "../src/db/database";

export interface SeedItem { id: string; name: string; price: number; category?: string; available?: boolean; description?: string }

export function defaultMenu(): SeedItem[] {
  return [
    { id: "americano", name: "Americano", price: 22000 },
    { id: "latte", name: "Caffe Latte", price: 28000 },
    { id: "es-kopi-susu", name: "Es Kopi Susu", price: 25000 },
    { id: "nasi-goreng", name: "Nasi Goreng", price: 35000, category: "food" },
    { id: "cheesecake", name: "Cheesecake", price: 30000, category: "dessert", available: false },
  ];
}

export function testDb(items: SeedItem[] = defaultMenu(), options: { tables?: boolean } = {}): Db {
  const db = openDatabase(":memory:");
  const insert = db.prepare("INSERT INTO menu_items (id, data, is_available, sort_order) VALUES (?, ?, ?, ?)");
  items.forEach((item, index) => insert.run(item.id, JSON.stringify({ id: item.id, name: item.name, price: item.price, category: item.category ?? "coffee", description: item.description ?? "" }), item.available === false ? 0 : 1, index));
  if (options.tables !== false) {
    db.exec("INSERT INTO floors (id, name, sort_order) VALUES ('f1', 'Lantai 1', 0)");
    db.exec("INSERT INTO cafe_tables (id, floor_id, label, status) VALUES ('A1', 'f1', 'Meja A1', 'available'), ('A2', 'f1', 'Meja A2', 'occupied')");
  }
  return db;
}
