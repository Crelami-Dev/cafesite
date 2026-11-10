import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serviceClient: SupabaseClient | null = null;

/** Supabase hanya aktif bila CONTENT_SOURCE=supabase. Default (sqlite): tidak ada koneksi keluar ke Supabase. */
export function getServiceSupabase(): SupabaseClient | null {
  if (process.env.CONTENT_SOURCE !== "supabase") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  serviceClient ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return serviceClient;
}
