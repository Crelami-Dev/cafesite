import { getBrowserSupabase } from "@/lib/supabase/browser";

export const adminInputClass = "min-h-11 w-full rounded-xl border border-charcoal-border bg-charcoal-darkest px-3 py-2.5 text-sm text-offwhite outline-none transition focus:border-latte disabled:opacity-50";
export const adminButtonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-terracotta px-4 py-2.5 text-sm font-semibold text-offwhite-pure transition hover:bg-terracotta-hover disabled:cursor-wait disabled:opacity-50";
export const adminSecondaryClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-charcoal-border px-4 py-2.5 text-sm font-medium text-offwhite transition hover:border-latte hover:bg-charcoal-light disabled:cursor-wait disabled:opacity-50";

/**
 * Request ke /api/admin/*. Mode lokal (SQLite, default): autentikasi lewat cookie sesi httpOnly.
 * Mode Supabase (NEXT_PUBLIC_DATA_SOURCE=supabase): token Bearer dari sesi Supabase.
 */
export async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const client = getBrowserSupabase();
  const headers: Record<string, string> = options.body instanceof FormData ? {} : { "Content-Type": "application/json" };
  if (client) {
    const { data: { session } } = await client.auth.getSession();
    if (!session) throw new Error("Sesi berakhir. Silakan masuk kembali.");
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  const response = await fetch(`/api/admin/${path}`, {
    ...options,
    cache: "no-store",
    credentials: "same-origin",
    headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "Perubahan belum tersimpan. Coba lagi.";
    throw new Error(message);
  }
  return body as T;
}

export function adminError(error: unknown): string {
  return error instanceof Error ? error.message : "Ada kendala. Silakan coba kembali.";
}

export async function saveAdminContent<T>(resource: string, data: T): Promise<void> {
  await adminRequest(`content?resource=${resource}`, { method: "PUT", body: JSON.stringify({ data }) });
}

export async function deleteAdminRecord(resource: string, id: string): Promise<void> {
  await adminRequest(`content?resource=${resource}`, { method: "DELETE", body: JSON.stringify({ id }) });
}
