import "server-only";
import { HttpError } from "./validation";

/** Helper respons untuk route admin mode lokal (SQLite); tidak menyentuh Supabase. */
export function localJson(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function localError(error: unknown): Response {
  if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  console.error("Local API request failed", error instanceof Error ? error.message : "Unknown error");
  return Response.json({ error: "Terjadi gangguan. Silakan coba kembali." }, { status: 500, headers: { "Cache-Control": "no-store" } });
}
