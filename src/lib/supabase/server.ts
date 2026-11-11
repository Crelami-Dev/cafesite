import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serviceClient: SupabaseClient | null = null;

/**
 * Client Supabase Service Role.
 * Aktif baik saat mode Cloud penuh (CONTENT_SOURCE=supabase / Vercel)
 * maupun mode Hybrid (SQLite lokal + auto-backup & restore ke Supabase Cloud).
 */
export function getServiceSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("placeholder") || key.includes("placeholder")) return null;
  serviceClient ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return serviceClient;
}
