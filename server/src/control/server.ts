import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import type { WaRuntime } from "../whatsapp/client";

export interface ControlOptions {
  host: string;
  port: number;
  token: string;
  /** Nomor bot untuk tampilan (opsional, disamarkan). */
  phone?: string | undefined;
  stats(): Record<string, unknown>;
}

function respond(res: ServerResponse, status: number, body: unknown): void {
  // Connection: close - lalu lintas jarang, dan menghindari ECONNRESET dari socket keep-alive basi di sisi Next.js.
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", Connection: "close" });
  res.end(JSON.stringify(body));
}

function authorized(request: IncomingMessage, token: string): boolean {
  const header = request.headers.authorization ?? "";
  const expected = Buffer.from(`Bearer ${token}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function maskPhone(phone: string | undefined): string | null {
  return phone ? `${phone.slice(0, 4)}••••${phone.slice(-3)}` : null;
}

/**
 * API kontrol privat untuk dashboard Next.js. Wajib token Bearer; dengarkan hanya di loopback/jaringan privat.
 * GET  /internal/control/status       status koneksi + statistik
 * GET  /internal/control/qr           QR pairing (hanya saat awaiting_qr)
 * POST /internal/control/connect      mulai koneksi (QR muncul di status)
 * POST /internal/control/restart      putus lalu sambung ulang (sesi tetap)
 * POST /internal/control/disconnect   putus, sesi tetap tersimpan
 * POST /internal/control/logout       putus dan hapus sesi (pairing ulang)
 */
export function startControlServer(runtime: WaRuntime, options: ControlOptions): Server {
  const view = (): Record<string, unknown> => ({ ...runtime.status(), configuredPhone: maskPhone(options.phone), ...options.stats() });
  const server = createServer((request, response) => {
    void (async () => {
      try {
        if (!authorized(request, options.token)) return respond(response, 401, { error: "Tidak diizinkan." });
        const path = new URL(request.url ?? "/", "http://localhost").pathname;
        const method = request.method ?? "GET";
        if (method === "GET" && path === "/internal/control/status") return respond(response, 200, view());
        if (method === "GET" && path === "/internal/control/qr") return respond(response, 200, { qr: runtime.status().qr, state: runtime.status().state });
        if (method === "POST" && path === "/internal/control/connect") { await runtime.start(); return respond(response, 202, view()); }
        if (method === "POST" && path === "/internal/control/restart") { await runtime.reconnect(); return respond(response, 202, view()); }
        if (method === "POST" && path === "/internal/control/disconnect") { await runtime.stop(); return respond(response, 200, view()); }
        if (method === "POST" && path === "/internal/control/logout") { await runtime.logout(); return respond(response, 200, view()); }
        return respond(response, 404, { error: "Endpoint tidak ditemukan." });
      } catch {
        return respond(response, 500, { error: "Terjadi gangguan pada server bot." });
      }
    })();
  });
  server.listen(options.port, options.host);
  return server;
}
