import type { Db } from "../db/database";

export interface AvailableTable {
  id: string;
  label: string;
  floorName: string;
}

/** Jumlah meja yang diatur di dashboard (berapa pun statusnya). 0 = kafe belum memakai pengaturan meja. */
export function countTables(db: Db): number {
  return Number(db.prepare("SELECT COUNT(*) AS n FROM cafe_tables").get()?.n ?? 0);
}

/** Meja berstatus 'available' saja (bukan occupied/dirty), lengkap dengan nama lantai. */
export function fetchAvailableTables(db: Db): AvailableTable[] {
  return db
    .prepare(
      `SELECT t.id, t.label, COALESCE(f.name, '') AS floor_name
       FROM cafe_tables t LEFT JOIN floors f ON f.id = t.floor_id
       WHERE t.status = 'available'
       ORDER BY COALESCE(f.sort_order, 0), t.id`,
    )
    .all()
    .map((row) => ({ id: String(row.id), label: String(row.label), floorName: String(row.floor_name) }));
}
