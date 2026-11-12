import "server-only";
import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuthUserInput {
  email: string;
  name: string;
  role: "admin" | "staff";
  enabled: boolean;
  /** Kata sandi polos hanya tersedia saat akun dibuat/di-reset/diganti. Tanpa ini, kata sandi Auth tidak diubah. */
  password?: string;
}

async function findAuthUserId(db: SupabaseClient, email: string): Promise<string | null> {
  const wanted = email.toLowerCase();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === wanted);
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

/**
 * Cerminkan akun dashboard ke Supabase Authentication (Authentication → Users) agar terlihat di sana.
 * Login dashboard tetap memakai tabel staff_accounts; entri Auth ini adalah salinan untuk pendataan.
 * Bila akun Auth belum ada dan kata sandi polos tidak diketahui, dibuat dengan kata sandi acak yang tidak dipakai.
 */
export async function upsertAuthUser(db: SupabaseClient, input: AuthUserInput): Promise<"saved" | "pending"> {
  try {
    const existingId = await findAuthUserId(db, input.email);
    const metadata = { name: input.name, role: input.role, source: "cafesite-dashboard" };
    const ban_duration = input.enabled ? "none" : "876000h";
    if (existingId) {
      const { error } = await db.auth.admin.updateUserById(existingId, {
        user_metadata: metadata,
        ban_duration,
        ...(input.password ? { password: input.password } : {}),
      });
      if (error) throw error;
    } else {
      const { error } = await db.auth.admin.createUser({
        email: input.email,
        password: input.password ?? randomBytes(24).toString("base64url"),
        email_confirm: true,
        user_metadata: metadata,
        ...(input.enabled ? {} : { ban_duration }),
      });
      if (error) throw error;
    }
    return "saved";
  } catch (error) {
    console.warn("[auth-sync] Gagal menyalin ke Supabase Authentication:", error instanceof Error ? error.message : error);
    return "pending";
  }
}

export async function deleteAuthUser(db: SupabaseClient, email: string): Promise<"saved" | "pending"> {
  try {
    const id = await findAuthUserId(db, email);
    if (id) {
      const { error } = await db.auth.admin.deleteUser(id);
      if (error) throw error;
    }
    return "saved";
  } catch (error) {
    console.warn("[auth-sync] Gagal menghapus di Supabase Authentication:", error instanceof Error ? error.message : error);
    return "pending";
  }
}
