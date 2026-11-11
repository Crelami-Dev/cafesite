import "server-only";
import { getServiceSupabase } from "@/lib/supabase/server";
import { HttpError } from "./validation";
import type { SupabaseClient } from "@supabase/supabase-js";

export function cloudDb(): SupabaseClient {
  const db = getServiceSupabase();
  if (!db) throw new HttpError(503, "Database cloud belum dikonfigurasi.");
  return db;
}
export function checkCloud(error: { code?: string; message: string } | null): void {
  if (!error) return;
  if (error.code === "23505") throw new HttpError(409, "Data sudah digunakan atau diperbarui. Muat ulang dan coba lagi.");
  if (error.code === "23503") throw new HttpError(409, "Data masih digunakan oleh catatan lain.");
  if (error.code === "P0001") throw new HttpError(409, error.message);
  console.error("[cloud-db]", error.code, error.message);
  throw new HttpError(503, "Database cloud belum siap atau tidak dapat dihubungi. Coba lagi.");
}
export async function cloudRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await cloudDb().rpc(name, args);
  checkCloud(error);
  return data as T;
}
