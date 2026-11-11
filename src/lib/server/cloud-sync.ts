import "server-only";
import { getLocalDb } from "@/lib/db/dev-sqlite";
import { getServiceSupabase } from "@/lib/supabase/server";

const globalSyncState = globalThis as unknown as {
  __cafeCloudSyncPromise?: Promise<void> | null;
  __cafeCloudSyncedAt?: number;
};

function canRunCloudSync(): boolean {
  if (process.env.NODE_ENV === "test") return false;
  return getServiceSupabase() !== null;
}

/**
 * Apakah aplikasi berjalan di environment Cloud tanpa disk SQLite permanen
 * (mis. Vercel / Netlify atau dipaksa lewat CONTENT_SOURCE=supabase).
 */
export function isCloudPrimaryEnv(): boolean {
  return process.env.CONTENT_SOURCE === "supabase" || process.env.VERCEL === "1";
}

function parseJson(raw: unknown): unknown {
  try {
    return JSON.parse(String(raw));
  } catch {
    return null;
  }
}

/**
 * Sinkronisasi awal dua arah antara SQLite lokal dan Supabase Cloud:
 * 1. Jika SQLite baru dibuat ulang (mis. file .data/cafesite.dev.db terhapus atau jalan di serverless /tmp)
 *    dan di Supabase sudah ada backup data, maka otomatis RESTORE dari Supabase ke SQLite.
 * 2. Jika di Supabase belum ada data tetapi di SQLite sudah ada data, maka otomatis BACKUP seluruh
 *    data SQLite ke Supabase.
 */
export async function ensureCloudSqliteSync(force = false): Promise<void> {
  if (!canRunCloudSync()) return;
  const now = Date.now();
  if (!force && globalSyncState.__cafeCloudSyncedAt && now - globalSyncState.__cafeCloudSyncedAt < 30_000) {
    return;
  }
  if (globalSyncState.__cafeCloudSyncPromise) {
    return globalSyncState.__cafeCloudSyncPromise;
  }

  globalSyncState.__cafeCloudSyncPromise = (async () => {
    const supabase = getServiceSupabase();
    if (!supabase) return;

    try {
      const db = getLocalDb();
      const localCafeRow = db.prepare("SELECT data FROM content WHERE key = 'cafe'").get();
      const hasLocalConfiguredCafe = Boolean(localCafeRow);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase sync timeout (2500ms)")), 2500),
      );

      const [contentRes, menuRes, floorsRes, tablesRes] = await Promise.race([
        Promise.all([
          supabase.from("content").select("key,data"),
          supabase.from("menu_items").select("id,data,is_available,sort_order").order("sort_order"),
          supabase.from("floors").select("id,name,sort_order").order("sort_order"),
          supabase.from("cafe_tables").select("id,floor_id,label,status"),
        ]),
        timeoutPromise,
      ]);

      if (contentRes.error || menuRes.error) {
        return;
      }

      const cloudContent = contentRes.data ?? [];
      const cloudMenu = menuRes.data ?? [];
      const cloudFloors = floorsRes.error ? [] : (floorsRes.data ?? []);
      const cloudTables = tablesRes.error ? [] : (tablesRes.data ?? []);
      const hasCloudCafe = cloudContent.some((row) => row.key === "cafe");

      // KASUS 1: SQLite baru/terhapus (belum ada key 'cafe') ATAU mode Cloud Primary -> Restore dari Supabase ke SQLite
      if ((!hasLocalConfiguredCafe && (hasCloudCafe || cloudMenu.length > 0)) || isCloudPrimaryEnv()) {
        db.exec("BEGIN IMMEDIATE");
        try {
          const upsertContent = db.prepare(
            "INSERT INTO content (key, data) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data",
          );
          for (const row of cloudContent) {
            if (row.key && row.data !== undefined) {
              upsertContent.run(String(row.key), JSON.stringify(row.data));
            }
          }

          if (cloudMenu.length > 0) {
            db.prepare("DELETE FROM menu_items").run();
            const insertMenu = db.prepare(
              "INSERT INTO menu_items (id, data, is_available, sort_order) VALUES (?, ?, ?, ?)",
            );
            for (const row of cloudMenu) {
              insertMenu.run(
                String(row.id),
                JSON.stringify(row.data),
                row.is_available === false ? 0 : 1,
                Number(row.sort_order ?? 0),
              );
            }
          }

          if (cloudFloors.length > 0) {
            const upsertFloor = db.prepare(
              "INSERT INTO floors (id, name, sort_order) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, sort_order = excluded.sort_order",
            );
            for (const floor of cloudFloors) {
              upsertFloor.run(String(floor.id), String(floor.name), Number(floor.sort_order ?? 0));
            }
          }

          if (cloudTables.length > 0) {
            const upsertTable = db.prepare(
              "INSERT INTO cafe_tables (id, floor_id, label, status) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET floor_id = excluded.floor_id, label = excluded.label, status = excluded.status",
            );
            for (const table of cloudTables) {
              upsertTable.run(
                String(table.id),
                String(table.floor_id),
                String(table.label),
                String(table.status ?? "available"),
              );
            }
          }
          db.exec("COMMIT");
        } catch (err) {
          db.exec("ROLLBACK");
          throw err;
        }
      } else {
        // KASUS 2: SQLite lokal punya data -> Backup ke Supabase Cloud agar Cloud selalu punya cadangan terbaru
        await pushFullSqliteSnapshotToSupabase();
      }

      globalSyncState.__cafeCloudSyncedAt = Date.now();
    } catch (err) {
      console.warn(
        "[cloud-sync] Sinkronisasi otomatis Supabase dilewati (menggunakan data lokal SQLite):",
        err instanceof Error ? err.message : err,
      );
    } finally {
      globalSyncState.__cafeCloudSyncPromise = null;
    }
  })();

  return globalSyncState.__cafeCloudSyncPromise;
}

/**
 * Dorong seluruh isi SQLite lokal (content, menu_items, floors, cafe_tables) ke Supabase Cloud.
 */
export async function pushFullSqliteSnapshotToSupabase(): Promise<void> {
  if (!canRunCloudSync()) return;
  const supabase = getServiceSupabase();
  if (!supabase) return;

  try {
    const db = getLocalDb();
    const contentRows = db
      .prepare("SELECT key, data FROM content WHERE key IN ('cafe','gallery','testimonials','faq','location','categories')")
      .all()
      .map((row) => ({
        key: String(row.key),
        data: parseJson(row.data),
      }))
      .filter((row) => row.data !== null);

    if (contentRows.length > 0) {
      const { error } = await supabase.from("content").upsert(contentRows, { onConflict: "key" });
      if (error && error.message.includes("content_key_check")) {
        // Fallback jika migrasi 03_dynamic_categories.sql belum dijalankan di Supabase
        await supabase
          .from("content")
          .upsert(
            contentRows.filter((row) => row.key !== "categories"),
            { onConflict: "key" },
          );
      }
    }

    const menuRows = db
      .prepare("SELECT id, data, is_available, sort_order FROM menu_items ORDER BY sort_order")
      .all()
      .map((row) => {
        const parsed = (parseJson(row.data) ?? {}) as Record<string, unknown>;
        return {
          id: String(row.id),
          data: { ...parsed, id: String(row.id) },
          is_available: Number(row.is_available) === 1,
          sort_order: Number(row.sort_order ?? 0),
        };
      });

    if (menuRows.length > 0) {
      await supabase.from("menu_items").upsert(menuRows, { onConflict: "id" });
    }

    const floorRows = db
      .prepare("SELECT id, name, sort_order FROM floors ORDER BY sort_order")
      .all()
      .map((row) => ({
        id: String(row.id),
        name: String(row.name),
        sort_order: Number(row.sort_order ?? 0),
      }));

    if (floorRows.length > 0) {
      await supabase.from("floors").upsert(floorRows, { onConflict: "id" });
    }

    const tableRows = db
      .prepare("SELECT id, floor_id, label, status FROM cafe_tables")
      .all()
      .map((row) => ({
        id: String(row.id),
        floor_id: String(row.floor_id),
        label: String(row.label),
        x: 10,
        y: 10,
        status: String(row.status),
      }));

    if (tableRows.length > 0) {
      await supabase.from("cafe_tables").upsert(tableRows, { onConflict: "id" });
    }
  } catch (err) {
    console.warn("[cloud-sync] Gagal mencadangkan snapshot ke Supabase:", err instanceof Error ? err.message : err);
  }
}

/**
 * Dual-Write: Setiap perubahan dari Dashboard ke SQLite otomatis di-mirror ke Supabase Cloud di background.
 */
export function mirrorWriteToSupabase(
  resource: string,
  payload: Record<string, unknown>,
): void {
  if (!canRunCloudSync()) return;
  const supabase = getServiceSupabase();
  if (!supabase) return;

  void (async () => {
    try {
      if (["cafe", "gallery", "testimonials", "faq", "location", "categories"].includes(resource)) {
        const { error } = await supabase
          .from("content")
          .upsert({ key: resource, data: payload.data ?? null }, { onConflict: "key" });
        if (error && resource === "categories" && error.message.includes("content_key_check")) {
          // Simpan juga di dalam cafe.categories jika constraint lama di Supabase belum diupdate
          const db = getLocalDb();
          const cafeData = (parseJson(db.prepare("SELECT data FROM content WHERE key = 'cafe'").get()?.data) ??
            {}) as Record<string, unknown>;
          await supabase
            .from("content")
            .upsert({ key: "cafe", data: { ...cafeData, categories: payload.data } }, { onConflict: "key" });
        }
        return;
      }

      if (resource === "menu") {
        if (Array.isArray(payload.reorder)) {
          const db = getLocalDb();
          const rows = db
            .prepare("SELECT id, data, is_available, sort_order FROM menu_items ORDER BY sort_order")
            .all()
            .map((row) => {
              const parsed = (parseJson(row.data) ?? {}) as Record<string, unknown>;
              return {
                id: String(row.id),
                data: { ...parsed, id: String(row.id) },
                is_available: Number(row.is_available) === 1,
                sort_order: Number(row.sort_order ?? 0),
              };
            });
          if (rows.length > 0) {
            await supabase.from("menu_items").upsert(rows, { onConflict: "id" });
          }
          return;
        }
        const item = payload.item as Record<string, unknown> | undefined;
        if (item && typeof item.id === "string") {
          await supabase.from("menu_items").upsert(
            {
              id: item.id,
              data: { ...item, id: item.id, price: Number(item.price ?? 0) },
              is_available: item.isAvailable !== false,
              sort_order: typeof payload.sortOrder === "number" ? payload.sortOrder : 0,
            },
            { onConflict: "id" },
          );
        }
        return;
      }

      if (resource === "floors" && payload.floor) {
        const floor = payload.floor as { id: string; name: string; sortOrder: number };
        await supabase.from("floors").upsert(
          {
            id: floor.id,
            name: floor.name,
            sort_order: floor.sortOrder,
          },
          { onConflict: "id" },
        );
        return;
      }

      if (resource === "tables" && payload.table) {
        const table = payload.table as { id: string; floorId: string; label: string; status: string };
        await supabase.from("cafe_tables").upsert(
          {
            id: table.id,
            floor_id: table.floorId,
            label: table.label,
            x: 10,
            y: 10,
            status: table.status,
          },
          { onConflict: "id" },
        );
      }
    } catch (err) {
      console.warn(`[cloud-sync] Gagal mirror tulis (${resource}) ke Supabase:`, err instanceof Error ? err.message : err);
    }
  })();
}

/**
 * Dual-Write Pesanan: Setiap pesanan baru atau perubahan status pesanan di SQLite
 * otomatis dicadangkan ke tabel orders & order_items di Supabase Cloud.
 */
export function mirrorOrderToSupabase(orderId: string): void {
  if (!canRunCloudSync()) return;
  const supabase = getServiceSupabase();
  if (!supabase) return;

  void (async () => {
    try {
      const db = getLocalDb();
      const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as Record<string, unknown> | undefined;
      if (!order) return;

      const items = db.prepare("SELECT id, order_id, menu_item_id, name, unit_price, quantity, notes FROM order_items WHERE order_id = ?").all(orderId) as Array<Record<string, unknown>>;

      // 1. Simpan/perbarui header order di Supabase
      const { error: orderError } = await supabase.from("orders").upsert(
        {
          id: String(order.id),
          idempotency_key: String(order.idempotency_key),
          queue_number: Number(order.queue_number),
          customer_name: String(order.customer_name),
          phone: String(order.phone),
          fulfillment: String(order.fulfillment),
          table_id: order.table_id ? String(order.table_id) : null,
          status: String(order.status),
          payment_method: String(order.payment_method ?? "cod"),
          payment_status: String(order.payment_status ?? "unpaid"),
          total: Number(order.total ?? 0),
          paid_amount: Number(order.paid_amount ?? 0),
          source: String(order.source ?? "website"),
          created_at: String(order.created_at),
          updated_at: String(order.updated_at),
        },
        { onConflict: "id" },
      );

      if (orderError) {
        console.warn("[cloud-sync] Gagal mencadangkan order ke Supabase:", orderError.message);
        return;
      }

      // 2. Simpan item-item pesanan
      if (items.length > 0) {
        const orderItemsPayload = items.map((item) => ({
          id: String(item.id),
          order_id: String(item.order_id),
          menu_item_id: String(item.menu_item_id),
          name: String(item.name),
          unit_price: Number(item.unit_price ?? 0),
          quantity: Number(item.quantity ?? 1),
          notes: String(item.notes ?? ""),
        }));
        await supabase.from("order_items").upsert(orderItemsPayload, { onConflict: "id" });
      }
    } catch (err) {
      console.warn(`[cloud-sync] Gagal mirror order (${orderId}) ke Supabase:`, err instanceof Error ? err.message : err);
    }
  })();
}

/**
 * Dual-Write Akun Staf: Setiap penambahan, pembaruan izin, atau reset password staf
 * di SQLite otomatis dicadangkan ke tabel staff_accounts & staff_permissions di Supabase Cloud.
 */
export function mirrorStaffToSupabase(accountId: string): void {
  if (!canRunCloudSync()) return;
  const supabase = getServiceSupabase();
  if (!supabase) return;

  void (async () => {
    try {
      const db = getLocalDb();
      const staff = db.prepare("SELECT * FROM staff_accounts WHERE id = ?").get(accountId) as Record<string, unknown> | undefined;
      if (!staff) return;

      const perms = db.prepare("SELECT module FROM staff_permissions WHERE account_id = ?").all(accountId) as Array<{ module: string }>;

      // 1. Simpan/perbarui staff_accounts
      await supabase.from("staff_accounts").upsert(
        {
          id: String(staff.id),
          name: String(staff.name),
          email: String(staff.email).toLowerCase(),
          password_hash: String(staff.password_hash),
          salt: String(staff.salt),
          enabled: Number(staff.enabled ?? 1),
          must_change_password: Number(staff.must_change_password ?? 1),
          created_at: String(staff.created_at),
        },
        { onConflict: "id" },
      );

      // 2. Perbarui staff_permissions
      await supabase.from("staff_permissions").delete().eq("account_id", accountId);
      if (perms.length > 0) {
        await supabase.from("staff_permissions").insert(
          perms.map((p) => ({
            account_id: accountId,
            module: String(p.module),
          })),
        );
      }
    } catch (err) {
      console.warn(`[cloud-sync] Gagal mirror akun staf (${accountId}) ke Supabase:`, err instanceof Error ? err.message : err);
    }
  })();
}

/**
 * Dual-Delete Akun Staf
 */
export function mirrorDeleteStaffToSupabase(accountId: string): void {
  if (!canRunCloudSync()) return;
  const supabase = getServiceSupabase();
  if (!supabase) return;

  void (async () => {
    try {
      await supabase.from("staff_accounts").delete().eq("id", accountId);
    } catch (err) {
      console.warn(`[cloud-sync] Gagal mirror hapus akun staf (${accountId}) ke Supabase:`, err instanceof Error ? err.message : err);
    }
  })();
}
export function mirrorDeleteToSupabase(resource: string, id: string): void {
  if (!canRunCloudSync()) return;
  const supabase = getServiceSupabase();
  if (!supabase) return;

  void (async () => {
    try {
      if (resource === "menu") {
        await supabase.from("menu_items").delete().eq("id", id);
      } else if (resource === "tables") {
        await supabase.from("cafe_tables").delete().eq("id", id);
      } else if (resource === "floors") {
        await supabase.from("floors").delete().eq("id", id);
      }
    } catch (err) {
      console.warn(`[cloud-sync] Gagal mirror hapus (${resource}:${id}) ke Supabase:`, err instanceof Error ? err.message : err);
    }
  })();
}

