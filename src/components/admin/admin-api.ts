export const adminInputClass =
  "min-h-11 w-full rounded-xl border border-charcoal-border bg-charcoal-darkest px-3 py-2.5 text-sm text-offwhite outline-none transition focus:border-offwhite disabled:opacity-50";
export const adminButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-terracotta px-4 py-2.5 text-sm font-semibold text-offwhite-pure transition hover:bg-terracotta-hover disabled:cursor-wait disabled:opacity-50";
export const adminSecondaryClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-charcoal-border px-4 py-2.5 text-sm font-medium text-offwhite transition hover:border-offwhite/40 hover:bg-charcoal-light disabled:cursor-wait disabled:opacity-50";

export const CONTENT_SYNC_CHANNEL = "cafesite-content-sync";
export const CONTENT_SYNC_STORAGE_KEY = "cafesite-content-updated-at";

export function notifyPublicContentUpdated(): void {
  if (typeof window === "undefined") return;
  const now = String(Date.now());
  try {
    const channel = new BroadcastChannel(CONTENT_SYNC_CHANNEL);
    channel.postMessage({ type: "content-updated", at: now });
    channel.close();
  } catch {
    // Abaikan jika BroadcastChannel tidak didukung browser
  }
  try {
    window.localStorage.setItem(CONTENT_SYNC_STORAGE_KEY, now);
  } catch {
    // Abaikan jika localStorage diblokir
  }
}

/**
 * Request ke /api/admin/*. Mode lokal (SQLite, default): autentikasi lewat cookie sesi httpOnly.
 */
export async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> =
    options.body instanceof FormData ? {} : { "Content-Type": "application/json" };
  const response = await fetch(`/api/admin/${path}`, {
    ...options,
    cache: "no-store",
    credentials: "same-origin",
    headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
  });
  const body: unknown = await response.json().catch(() => null);
  if (response.status === 401 && typeof window !== "undefined") {
    window.location.replace(new URL("/auth", window.location.origin).href);
  }
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : "Perubahan belum tersimpan. Coba lagi.";
    throw new Error(message);
  }
  const method = (options.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    notifyPublicContentUpdated();
  }
  return body as T;
}

export function adminError(error: unknown): string {
  return error instanceof Error ? error.message : "Ada kendala. Silakan coba kembali.";
}

export async function saveAdminContent<T>(resource: string, data: T): Promise<void> {
  await adminRequest(`manage?resource=${resource}`, {
    method: "PUT",
    body: JSON.stringify({ data }),
  });
}

export async function deleteAdminRecord(resource: string, id: string): Promise<void> {
  await adminRequest(`manage?resource=${resource}`, {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}
