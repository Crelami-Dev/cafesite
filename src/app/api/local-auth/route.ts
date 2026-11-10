import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createLocalToken, isLocalMode, LOCAL_COOKIE, LOCAL_SESSION_SECONDS } from "@/lib/server/local-session";

function same(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request): Promise<Response> {
  if (!isLocalMode()) return Response.json({ error: "Login lokal tidak aktif." }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { email?: unknown; password?: unknown };
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  const expectedEmail = process.env.LOCAL_ADMIN_EMAIL ?? "";
  const expectedPassword = process.env.LOCAL_ADMIN_PASSWORD ?? "";
  // Kedua perbandingan selalu dijalankan agar waktu respons tidak membocorkan mana yang salah.
  const emailOk = same(email, expectedEmail);
  const passwordOk = same(password, expectedPassword);
  if (!expectedEmail || !expectedPassword || !emailOk || !passwordOk) return Response.json({ error: "Email atau kata sandi tidak cocok." }, { status: 401 });
  (await cookies()).set(LOCAL_COOKIE, createLocalToken(email), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: LOCAL_SESSION_SECONDS });
  return Response.json({ ok: true });
}

export async function DELETE(): Promise<Response> {
  (await cookies()).delete(LOCAL_COOKIE);
  return Response.json({ ok: true });
}
