import { localError, localJson } from "@/lib/server/local-api";
import { requireLocalAdmin } from "@/lib/server/local-session";
import { HttpError } from "@/lib/server/validation";

const ACTIONS = ["connect", "restart", "disconnect", "logout"] as const;
type Action = (typeof ACTIONS)[number];

/** Teruskan perintah ke server bot (loopback) memakai token privat; token tidak pernah sampai ke browser. */
async function control(path: string, method: "GET" | "POST"): Promise<Response> {
  const base = process.env.WA_BOT_CONTROL_URL;
  const token = process.env.WA_BOT_CONTROL_TOKEN;
  if (!base || !token) throw new HttpError(503, "Kontrol bot belum dikonfigurasi. Isi WA_BOT_CONTROL_URL dan WA_BOT_CONTROL_TOKEN di .env.local.");
  let result: Response;
  try {
    result = await fetch(new URL(`/internal/control/${path}`, base), { method, headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8_000) });
  } catch {
    throw new HttpError(503, "Server bot belum berjalan. Jalankan `npm run dev` di folder server/ lalu coba lagi.");
  }
  if (result.status === 401) throw new HttpError(503, "Token kontrol tidak cocok. Samakan WA_BOT_CONTROL_TOKEN dengan BOT_CONTROL_TOKEN di server/.env.local.");
  if (!result.ok) throw new HttpError(503, "Server bot tidak dapat dihubungi.");
  return localJson(await result.json());
}

export async function GET(request: Request): Promise<Response> {
  try {
    await requireLocalAdmin(request);
    return await control(new URL(request.url).searchParams.get("view") === "qr" ? "qr" : "status", "GET");
  } catch (error) { return localError(error); }
}

export async function POST(request: Request): Promise<Response> {
  try {
    await requireLocalAdmin(request);
    const action = ((await request.json().catch(() => null)) as { action?: unknown } | null)?.action;
    if (!ACTIONS.includes(action as Action)) throw new HttpError(400, "Aksi bot tidak valid.");
    return await control(action as Action, "POST");
  } catch (error) { return localError(error); }
}
