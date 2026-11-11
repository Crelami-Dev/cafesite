import { getServiceSupabase } from "@/lib/supabase/server";
import { json } from "@/lib/server/api";
import { isLocalMode } from "@/lib/server/local-session";
import type { CatalogResponse, MenuItem } from "@/types";

export async function GET(): Promise<Response> {
  if (isLocalMode()) {
    try {
      const { localCatalog } = await import("@/lib/server/local-orders");
      return json(localCatalog());
    } catch {
      return json({ menu: [], tables: [], configured: false, onlinePayment: false } satisfies CatalogResponse);
    }
  }
  const db = getServiceSupabase();
  if (!db) return json({ menu: [], tables: [], configured: false, onlinePayment: false } satisfies CatalogResponse);
  const [menu, tables] = await Promise.all([db.from("menu_items").select("id,data,is_available,sort_order").eq("is_available", true).order("sort_order"), db.from("cafe_tables").select("id,floor_id,label,x,y,status")]);
  if (menu.error || tables.error) return json({ menu: [], tables: [], configured: false, onlinePayment: false } satisfies CatalogResponse);
  return json({ menu: menu.data.map(row => ({ ...row.data, id: row.id, isAvailable: row.is_available }) as MenuItem), tables: tables.data, configured: true, onlinePayment: false } satisfies CatalogResponse);
}
