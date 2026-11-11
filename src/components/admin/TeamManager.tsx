"use client";

import { useCallback, useEffect, useState } from "react";
import type { StaffAccount, StaffCloudState } from "@/types";
import { dashboardNavigation } from "@/lib/admin-navigation";
import { CheckIcon, PlusIcon, ShieldIcon, UserIcon, WarningIcon } from "@/components/ui/icons";
import { useDashboard } from "./DashboardShell";
import { adminRequest, adminError, adminButtonClass, adminInputClass, adminSecondaryClass } from "./admin-api";
import DashboardDialog from "./DashboardDialog";
import EmptyState from "./ui/EmptyState";
import PageHeader from "./ui/PageHeader";
import SegmentedTabs from "./ui/SegmentedTabs";
import Skeleton from "./ui/Skeleton";
import StatusBadge from "./ui/StatusBadge";
import Switch from "./ui/Switch";

const MODULES = dashboardNavigation.filter((n) => !["summary", "modules"].includes(n.id));

const BLANK: StaffAccount = { id: "", name: "", email: "", role: "staff", enabled: true, mustChangePassword: true, modules: [] };

interface SavedInfo {
  temporaryPassword?: string;
  cloud: StaffCloudState;
  name: string;
}

function cloudNote(state: StaffCloudState): { text: string; ok: boolean } | null {
  if (state === "saved") return { text: "Tersimpan juga di Supabase, jadi akun ini bisa dipakai di situs publik.", ok: true };
  if (state === "pending") return { text: "Tersimpan di komputer ini, tetapi salinan ke Supabase belum berhasil. Coba simpan ulang saat koneksi pulih.", ok: false };
  return null;
}

export default function TeamManager(): React.JSX.Element {
  const { account } = useDashboard();
  const [rows, setRows] = useState<StaffAccount[]>([]);
  const [edit, setEdit] = useState<StaffAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<SavedInfo | null>(null);
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

  function openEdit(row: StaffAccount): void {
    setEdit({ ...row });
    setReset(false);
    setDirty(false);
    setError("");
  }

  function closeEdit(): void {
    if (busy) return;
    if (!dirty || window.confirm("Buang perubahan yang belum disimpan?")) {
      setEdit(null);
      setDirty(false);
    }
  }

  function change(next: StaffAccount): void {
    setEdit(next);
    setDirty(true);
  }

  async function save(): Promise<void> {
    if (!edit) return;
    setBusy(true);
    setError("");
    try {
      const r = await adminRequest<{ temporaryPassword?: string; cloud: StaffCloudState }>("team", {
        method: "PUT",
        body: JSON.stringify({ ...edit, id: edit.id || undefined, resetPassword: reset }),
      });
      setSaved({ temporaryPassword: r.temporaryPassword, cloud: r.cloud, name: edit.name });
      setEdit(null);
      setDirty(false);
      await load();
    } catch (e) {
      setError(adminError(e));
    } finally {
      setBusy(false);
    }
  }

  const isSelf = edit?.id !== "" && edit?.id === account.profile.id;
  const note = saved ? cloudNote(saved.cloud) : null;

  return (
    <div className="grid gap-4 md:gap-5">
      <PageHeader
        title="Akses tim"
        description="Buat akun admin atau staf. Akun tersimpan lokal dan disalin ke Supabase."
        actions={
          <button
            type="button"
            onClick={() => {
              setEdit({ ...BLANK });
              setReset(false);
              setDirty(false);
              setError("");
            }}
            className={adminButtonClass}
          >
            <PlusIcon className="size-4" /> Tambah akun
          </button>
        }
      />

      {error && !edit && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-terracotta-light/40 bg-terracotta/10 p-3 text-sm text-terracotta-light">
          <span>{error}</span>
          <button type="button" className={adminSecondaryClass} onClick={() => void load()}>
            Coba lagi
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-3" aria-busy="true">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<UserIcon className="size-8" />}
          title="Belum ada akun tim"
          hint="Akun pemilik dari konfigurasi server tetap punya seluruh akses."
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map((row) => (
            <li key={row.id} className={`min-w-0 rounded-lg border border-offwhite/10 bg-charcoal-light p-4 ${row.enabled ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-offwhite">{row.name}</p>
                  <p className="mt-0.5 truncate text-sm text-offwhite-muted">{row.email}</p>
                </div>
                {row.role === "admin" ? (
                  <StatusBadge tone="done" icon={<ShieldIcon className="size-3.5" />}>
                    Admin
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="muted" icon={<UserIcon className="size-3.5" />}>
                    Staf
                  </StatusBadge>
                )}
              </div>
              <p className="mt-3 text-xs text-offwhite-darker">
                {row.enabled ? "Aktif" : "Nonaktif"} · {row.role === "admin" ? "Semua modul" : `${row.modules.length} modul`}
                {row.mustChangePassword ? " · Perlu ganti kata sandi" : ""}
              </p>
              <button type="button" onClick={() => openEdit(row)} className={`${adminSecondaryClass} mt-3 w-full`}>
                Kelola akun
              </button>
            </li>
          ))}
        </ul>
      )}

      {edit && (
        <DashboardDialog title={edit.id ? "Kelola akun" : "Tambah akun"} onClose={closeEdit}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
            className="grid gap-5"
          >
            <div className="grid gap-2">
              <span className="text-sm font-medium">Peran</span>
              <SegmentedTabs
                label="Peran akun"
                value={edit.role}
                options={[
                  { value: "staff", label: "Staf" },
                  { value: "admin", label: "Admin" },
                ]}
                onChange={(role) => {
                  if (isSelf) return;
                  change({ ...edit, role });
                }}
              />
              <p className="text-xs text-offwhite-muted">
                {isSelf
                  ? "Anda tidak bisa mengubah peran akun Anda sendiri."
                  : edit.role === "admin"
                    ? "Admin punya semua modul dan boleh mengelola Akses tim."
                    : "Staf hanya bisa membuka modul yang dicentang."}
              </p>
            </div>

            {(
              [
                ["name", "Nama"],
                ["email", "Email"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="grid gap-2 text-sm font-medium">
                {label}
                <input
                  type={key === "email" ? "email" : "text"}
                  required
                  maxLength={160}
                  value={edit[key]}
                  onChange={(e) => change({ ...edit, [key]: e.target.value })}
                  className={adminInputClass}
                />
              </label>
            ))}

            {edit.role === "staff" && (
              <fieldset>
                <legend className="mb-3 text-sm font-medium">Modul yang boleh dibuka</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {MODULES.map((n) => {
                    const checked = edit.modules.includes(n.id);
                    return (
                      <label
                        key={n.id}
                        className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm transition ${
                          checked ? "border-terracotta bg-terracotta/10" : "border-offwhite/10"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="size-5 accent-terracotta"
                          checked={checked}
                          onChange={(e) =>
                            change({
                              ...edit,
                              modules: e.target.checked ? [...edit.modules, n.id] : edit.modules.filter((m) => m !== n.id),
                            })
                          }
                        />
                        {n.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <div className="flex items-center justify-between gap-3 rounded-lg border border-offwhite/10 px-3">
              <span className="text-sm">Akun aktif</span>
              <Switch
                label="Akun aktif"
                checked={edit.enabled}
                disabled={isSelf}
                onChange={(enabled) => change({ ...edit, enabled })}
              />
            </div>

            {edit.id && (
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={reset}
                  onChange={(e) => {
                    setReset(e.target.checked);
                    setDirty(true);
                  }}
                  className="size-5 accent-terracotta"
                />
                Reset kata sandi dan keluarkan semua sesi
              </label>
            )}

            {error && (
              <p role="alert" className="rounded-lg border border-terracotta-light/40 bg-terracotta/10 p-3 text-sm text-terracotta-light">
                {error}
              </p>
            )}

            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <button disabled={busy} className={`${adminButtonClass} sm:min-w-40`}>
                {busy ? "Menyimpan…" : edit.id ? "Simpan perubahan" : "Buat akun"}
              </button>
              <button type="button" onClick={closeEdit} className={adminSecondaryClass}>
                Batal
              </button>
            </div>
          </form>
        </DashboardDialog>
      )}

      {saved && (
        <DashboardDialog title={saved.temporaryPassword ? "Kata sandi sementara" : "Akun tersimpan"} onClose={() => setSaved(null)}>
          <div className="grid gap-4">
            {saved.temporaryPassword ? (
              <>
                <p className="text-sm text-offwhite-muted">
                  Berikan kepada {saved.name}. Kata sandi ini hanya tampil sekali dan wajib diganti setelah masuk.
                </p>
                <p className="break-all rounded-lg bg-charcoal-darkest p-4 font-mono text-xl tabular-nums">{saved.temporaryPassword}</p>
              </>
            ) : (
              <p className="text-sm text-offwhite-muted">Perubahan untuk {saved.name} sudah disimpan.</p>
            )}
            {note && (
              <p
                className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                  note.ok ? "border-offwhite/20 text-offwhite" : "border-terracotta-light/40 bg-terracotta/10 text-terracotta-light"
                }`}
              >
                {note.ok ? <CheckIcon className="mt-0.5 size-4 shrink-0" /> : <WarningIcon className="mt-0.5 size-4 shrink-0" />}
                {note.text}
              </p>
            )}
            <button type="button" className={adminButtonClass} onClick={() => setSaved(null)}>
              Sudah disimpan
            </button>
          </div>
        </DashboardDialog>
      )}
    </div>
  );
}
