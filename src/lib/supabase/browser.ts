"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/** Aktif hanya bila NEXT_PUBLIC_DATA_SOURCE=supabase; default (sqlite) tidak membuat koneksi ke Supabase. */
export function getBrowserSupabase(): SupabaseClient | null {
  if (process.env.NEXT_PUBLIC_DATA_SOURCE !== "supabase") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  browserClient ??= createClient(url, key);
  return browserClient;
}
