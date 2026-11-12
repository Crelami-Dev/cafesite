export const adminInputClass =
  "min-h-11 w-full rounded-lg border border-charcoal-border bg-charcoal-darkest px-3 py-2.5 text-base text-offwhite outline-none transition placeholder:text-offwhite-darker focus:border-offwhite disabled:opacity-50 sm:text-sm";
export const adminButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-terracotta px-4 py-2.5 text-sm font-semibold text-offwhite-pure transition hover:bg-terracotta-hover active:scale-[.98] disabled:cursor-wait disabled:opacity-50";
export const adminSecondaryClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-offwhite/20 px-4 py-2.5 text-sm font-medium text-offwhite transition hover:border-offwhite/40 hover:bg-charcoal-light active:scale-[.98] disabled:cursor-wait disabled:opacity-50";
/** Aksi destruktif: outline terracotta, selalu dengan konfirmasi di pemanggil. */
export const adminDangerClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-terracotta-light/50 px-4 py-2.5 text-sm font-medium text-terracotta-light transition hover:bg-terracotta/10 active:scale-[.98] disabled:cursor-wait disabled:opacity-50";

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
 * Cache sementara di memori (hilang saat halaman di-refresh). Dipakai agar pindah halaman dashboard
 * langsung menampilkan data terakhir sambil data baru dimuat di latar. Dikosongkan setiap ada perubahan data.
 */
const responseCache = new Map<string, unknown>();
/** Permintaan GET yang sedang berjalan, supaya permintaan kembar tidak dikirim dua kali. */
const inflight = new Map<string, Promise<unknown>>();

/** Data terakhir untuk sebuah path GET, bila ada. Aman dipanggil di initializer useState. */
export function adminPeek<T>(path: string): T | undefined {
  return responseCache.get(path) as T | undefined;
}

/**
 * Request ke /api/admin/*. Mode lokal (SQLite, default): autentikasi lewat cookie sesi httpOnly.
 */
export async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  // Permintaan yang SAMA PERSIS (metode, alamat, isi) dan masih berjalan dipakai bersama, bukan dikirim lagi.
  // Ini jaring pengaman terakhir untuk klik ganda; unggah file (FormData) dikecualikan.
  const dedupable = typeof options.body === "string" || options.body === undefined || options.body === null;
  const key = `${method} ${path} ${dedupable ? (options.body ?? "") : ""}`;
  if (dedupable) {
    const running = inflight.get(key);
    if (running) return running as Promise<T>;
  }
  const request = send<T>(path, options, method);
  if (dedupable) {
    inflight.set(key, request);
    void request.then(
      () => inflight.delete(key),
      () => inflight.delete(key),
    );
  }
  return request;
}

/** Error dari server dengan kode status HTTP, supaya UI bisa membedakan konflik (409) dari gangguan (5xx). */
export class AdminRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AdminRequestError";
  }
}

/** true bila server menolak karena data berubah/bentrok (409), bukan gangguan sementara. */
export function isConflict(error: unknown): boolean {
  return error instanceof AdminRequestError && error.status === 409;
}

async function send<T>(path: string, options: RequestInit, method: string): Promise<T> {
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
    throw new AdminRequestError(message, response.status);
  }
  if (method === "GET") {
    responseCache.set(path, body);
  } else if (method !== "HEAD") {
    responseCache.clear();
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
