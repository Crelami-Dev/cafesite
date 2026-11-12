import "server-only";
import { randomUUID } from "node:crypto";
import { getLocalDb } from "@/lib/db/dev-sqlite";
import { isCloudPrimaryEnv } from "./storage-mode";
import { cloudRpc } from "./cloud-db";
import { readCloudOrder } from "./cloud-orders";
import { readLocalOrder } from "./local-orders";
import { cashierQr } from "./order-security";
import { HttpError, itemInputs, objectValue, textValue } from "./validation";
import type { Order } from "@/types";

export async function customerOrder(
  id: string,
  token: string | null,
): Promise<{ order: Order; cashierQr: string }> {
  const order = isCloudPrimaryEnv()
    ? await readCloudOrder(id, token)
    : readLocalOrder(id, token);
  return { order, cashierQr: cashierQr(id) };
}
export async function editCustomerOrder(
  id: string,
  token: string | null,
  body: unknown,
): Promise<{ order: Order; cashierQr: string }> {
  await customerOrder(id, token);
  const raw = objectValue(body),
    items = itemInputs(raw.items),
    expectedUpdatedAt = textValue(raw.expectedUpdatedAt, "Versi pesanan", 64);
  if (isCloudPrimaryEnv()) {
    await cloudRpc("cafesite_edit_customer_order", {
      input: { id, items, expectedUpdatedAt },
    });
  } else {
    const db = getLocalDb();
    db.exec("BEGIN IMMEDIATE");
    try {
      const current = readLocalOrder(id, token);
      if (
        current.status !== "waiting" ||
        current.payment_status !== "unpaid" ||
        current.updated_at !== expectedUpdatedAt
      )
        throw new HttpError(
          409,
          "Pesanan sudah berubah atau dibayar. Muat ulang rincian terbaru.",
        );
      let total = 0;
      const lines = items.map((line) => {
        const row = db
          .prepare("SELECT data FROM menu_items WHERE id=? AND is_available=1")
          .get(line.menuItemId);
        if (!row)
          throw new HttpError(
            409,
            "Salah satu menu sudah habis. Sesuaikan pesanan.",
          );
        const menu = JSON.parse(String(row.data)) as {
          name: string;
          price: number;
        };
        if (!Number.isSafeInteger(menu.price) || menu.price < 0)
          throw new HttpError(409, "Harga menu belum valid.");
        total += menu.price * line.quantity;
        return { ...line, ...menu };
      });
      db.prepare("DELETE FROM order_items WHERE order_id=?").run(id);
      const insert = db.prepare(
        "INSERT INTO order_items(id,order_id,menu_item_id,name,unit_price,quantity,notes) VALUES(?,?,?,?,?,?,?)",
      );
      for (const line of lines)
        insert.run(
          randomUUID(),
          id,
          line.menuItemId,
          line.name,
          line.price,
          line.quantity,
          line.notes,
        );
      const stamp = new Date(
        Math.max(Date.now(), Date.parse(current.updated_at) + 1),
      ).toISOString();
      db.prepare("UPDATE orders SET total=?,updated_at=? WHERE id=?").run(
        total,
        stamp,
        id,
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  return customerOrder(id, token);
}
