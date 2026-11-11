"use client";

import { useCallback, useEffect, useState } from "react";
import type { StaffAccount } from "@/types";
import { dashboardNavigation } from "@/lib/admin-navigation";
import { adminRequest, adminError, adminButtonClass, adminInputClass, adminSecondaryClass } from "./admin-api";
import DashboardDialog from "./DashboardDialog";

export default function TeamManager(): React.JSX.Element {
  const [rows, setRows] = useState<StaffAccount[]>([]);
  const [edit, setEdit] = useState<StaffAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [reset, setReset] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try {
      const r = await adminRequest<{ data: StaffAccount[] }>("team");
      setRows(r.data);
      setError("");
    } catch (e) {
      setError(adminError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function closeEdit(): void {
    if (busy) return;
    if (!dirty || window.confirm("Buang perubahan akses staf yang belum disimpan?")) {
      setEdit(null);
      setDirty(false);
    }
  }

  async function save(): Promise<void> {
    if (!edit) return;
    setBusy(true);
    setError("");
    try {
      const r = await adminRequest<{ temporaryPassword?: string }>("team", {
        method: "PUT",
        body: JSON.stringify({ ...edit, id: edit.id || undefined, resetPassword: reset }),
      });
      setEdit(null);
      setDirty(false);
      setPassword(r.temporaryPassword ?? "");
      await load();
    } catch (e) {
      setError(adminError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-offwhite-muted tabular-nums">{rows.length} akun staf</p>
        <button
          type="button"
          onClick={() => {
            setEdit({ id: "", name: "", email: "", enabled: true, mustChangePassword: true, modules: [] });
            setReset(false);
            setDirty(false);
            setError("");
          }}
          className={adminButtonClass}
        >
          Tambah staf
        </button>
      </div>

      {error && !edit && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-terracotta-light">
          <span>{error}</span>
          <button type="button" className={adminSecondaryClass} onClick={() => void load()}>
            Coba lagi
          </button>
        </div>
      )}

      {loading ? (
        <p role="status" className="text-sm text-offwhite-muted">
          Memuat akun…
        </p>
      ) : (
        <section className="divide-y divide-offwhite/10 rounded-xl border border-offwhite/10">
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-offwhite-muted">Belum ada staf. Akun pemilik tetap memiliki seluruh akses.</p>
          ) : (
            rows.map((row) => (
              <article key={row.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <h2 className="font-semibold">{row.name}</h2>
                  <p className="mt-1 break-all text-sm text-offwhite-muted">{row.email}</p>
                  <p className="mt-2 text-xs text-offwhite-darker tabular-nums">
                    {row.enabled ? "✓ Aktif" : "✕ Nonaktif"} · {row.modules.length} modul
                    {row.mustChangePassword ? " · ◷ Perlu ganti kata sandi" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEdit({ ...row });
                    setReset(false);
                    setDirty(false);
                    setError("");
                  }}
                  className={adminSecondaryClass}
                >
                  Kelola akses
                </button>
              </article>
            ))
          )}
        </section>
      )}

      {edit && (
        <DashboardDialog title={edit.id ? "Kelola staf" : "Tambah staf"} onClose={closeEdit}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
            className="grid gap-5"
          >
            {(
              [
                ["name", "Nama"],
                ["email", "Email"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="grid gap-2 text-sm">
                {label}
                <input
                  type={key === "email" ? "email" : "text"}
                  required
                  maxLength={160}
                  value={edit[key]}
                  onChange={(e) => {
                    setEdit({ ...edit, [key]: e.target.value });
                    setDirty(true);
                  }}
                  className={adminInputClass}
                />
              </label>
            ))}

            <fieldset>
              <legend className="mb-3 text-sm font-semibold">Izin modul</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {dashboardNavigation
                  .filter((n) => !["summary", "modules"].includes(n.id))
                  .map((n) => (
                    <label key={n.id} className="flex min-h-11 items-center gap-3 rounded-lg border border-offwhite/10 px-3 text-sm">
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-terracotta"
                        checked={edit.modules.includes(n.id)}
                        onChange={(e) => {
                          setEdit({
                            ...edit,
                            modules: e.target.checked ? [...edit.modules, n.id] : edit.modules.filter((m) => m !== n.id),
                          });
                          setDirty(true);
                        }}
                      />
                      {n.label}
                    </label>
                  ))}
              </div>
            </fieldset>

            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={edit.enabled}
                onChange={(e) => {
                  setEdit({ ...edit, enabled: e.target.checked });
                  setDirty(true);
                }}
                className="h-5 w-5 accent-terracotta"
              />
              Akun aktif
            </label>

            {edit.id && (
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={reset}
                  onChange={(e) => {
                    setReset(e.target.checked);
                    setDirty(true);
                  }}
                  className="h-5 w-5 accent-terracotta"
                />
                Reset kata sandi dan keluarkan semua sesi
              </label>
            )}

            {error && (
              <p role="alert" className="text-sm text-terracotta-light">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button disabled={busy} className={adminButtonClass}>
                {busy ? "Menyimpan…" : "Simpan akses"}
              </button>
              <button type="button" onClick={closeEdit} className={adminSecondaryClass}>
                Batal
              </button>
            </div>
          </form>
        </DashboardDialog>
      )}

      {password && (
        <DashboardDialog title="Kata sandi sementara" onClose={() => setPassword("")}>
          <p className="text-sm text-offwhite-muted">
            Salin dan berikan langsung kepada staf. Kata sandi ini hanya ditampilkan sekali; staf wajib menggantinya setelah masuk.
          </p>
          <p className="my-6 break-all rounded-lg bg-charcoal-darkest p-4 font-mono text-xl tabular-nums">{password}</p>
          <button type="button" className={adminButtonClass} onClick={() => setPassword("")}>
            Sudah disimpan
          </button>
        </DashboardDialog>
      )}
    </div>
  );
}
