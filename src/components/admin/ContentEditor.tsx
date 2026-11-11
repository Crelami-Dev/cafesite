"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { contentFields, contentOptionLabels } from "@/lib/admin-content-fields";
import type { OpeningHour } from "@/types";
import { ParkingIcon, SignpostIcon, TransitIcon } from "@/components/ui/icons";
import { adminRequest, adminError, adminInputClass, adminButtonClass, adminSecondaryClass } from "./admin-api";
import DashboardDialog from "./DashboardDialog";

type Entry = Record<string, string | number>;

function LocationIconPreview({ icon }: { icon?: string }): React.JSX.Element {
  if (icon === "landmark") return <SignpostIcon className="h-5 w-5 text-terracotta-light" />;
  if (icon === "transit") return <TransitIcon className="h-5 w-5 text-terracotta-light" />;
  return <ParkingIcon className="h-5 w-5 text-terracotta-light" />;
}

export default function ContentEditor({ resource }: { resource: string }): React.JSX.Element {
  const [rows, setRows] = useState<Entry[]>([]);
  const [hours, setHours] = useState<OpeningHour[]>([]);
  const [edit, setEdit] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const cafe = resource === "cafe";

  useEffect(() => {
    let live = true;
    adminRequest<{ data: unknown }>(`manage?resource=${resource}`)
      .then((r) => {
        if (!live) return;
        if (cafe) {
          const data = r.data as Entry & { openingHours?: OpeningHour[] };
          setEdit(data);
          setHours(data.openingHours ?? []);
        } else {
          setRows((r.data ?? []) as Entry[]);
        }
      })
      .catch((e) => {
        if (live) setError(adminError(e));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [resource, cafe]);

  useEffect(() => {
    if (!dirty) return;
    const leave = (e: BeforeUnloadEvent): void => {
      e.preventDefault();
    };
    const click = (e: MouseEvent): void => {
      if ((e.target as HTMLElement).closest("a[href]") && !window.confirm("Perubahan belum disimpan. Tinggalkan halaman?")) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", leave);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", leave);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);

  async function persist(data: unknown): Promise<boolean> {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await adminRequest(`manage?resource=${resource}`, { method: "PUT", body: JSON.stringify({ data }) });
      setMessage("Perubahan tersimpan dan tampil di website.");
      setDirty(false);
      return true;
    } catch (e) {
      setError(adminError(e));
      return false;
    } finally {
      setBusy(false);
    }
  }

  function close(): void {
    if (busy) return;
    if (!dirty || window.confirm("Buang perubahan yang belum disimpan?")) {
      setEdit(null);
      setDirty(false);
    }
  }

  async function save(): Promise<void> {
    if (!edit) return;
    if (cafe) {
      const invalidHour = hours.find((h) => h.isOpen && (!h.openTime || !h.closeTime || h.openTime >= h.closeTime));
      if (invalidHour) {
        setError(`Jam tutup untuk hari ${invalidHour.day} harus setelah jam buka.`);
        return;
      }
      await persist({
        ...edit,
        openingHours: hours.map((h) => ({
          ...h,
          hours: h.isOpen ? `${h.openTime} – ${h.closeTime}` : "Tutup",
        })),
      });
    } else {
      const next = rows.some((r) => r.id === edit.id) ? rows.map((r) => (r.id === edit.id ? edit : r)) : [...rows, edit];
      if (await persist(next)) {
        setRows(next);
        setEdit(null);
      }
    }
  }

  async function move(index: number, delta: number): Promise<void> {
    const next = [...rows];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    if (await persist(next)) setRows(next);
  }

  const fields = contentFields[resource] ?? [];

  const form = (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className={`grid gap-2 text-sm ${field.type === "textarea" ? "md:col-span-2" : ""}`}>
            {field.label}
            {field.required ? " *" : ""}
            {field.options ? (
              <select
                className={adminInputClass}
                value={edit?.[field.key] ?? field.options[0]}
                onChange={(e) => {
                  setEdit({ ...edit!, [field.key]: e.target.value });
                  setDirty(true);
                }}
              >
                {field.options.map((o) => (
                  <option key={o} value={o}>
                    {contentOptionLabels[o] ?? o}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                className={`${adminInputClass} min-h-28`}
                required={field.required}
                value={edit?.[field.key] ?? ""}
                onChange={(e) => {
                  setEdit({ ...edit!, [field.key]: e.target.value });
                  setDirty(true);
                }}
              />
            ) : (
              <input
                className={`${adminInputClass} ${field.type === "number" ? "tabular-nums" : ""}`}
                type={field.type ?? "text"}
                required={field.required}
                min={field.key === "rating" ? 1 : undefined}
                max={field.key === "rating" ? 5 : undefined}
                maxLength={5000}
                value={edit?.[field.key] ?? ""}
                onChange={(e) => {
                  setEdit({ ...edit!, [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value });
                  setDirty(true);
                }}
              />
            )}
          </label>
        ))}
      </div>

      {resource === "gallery" && (
        <div className="grid gap-3">
          <label className="grid gap-2 text-sm">
            Unggah foto
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              disabled={busy}
              className={adminInputClass}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                setError("");
                try {
                  const formData = new FormData();
                  formData.set("file", file);
                  formData.set("folder", "gallery");
                  const r = await adminRequest<{ url: string }>("upload?folder=gallery", { method: "POST", body: formData });
                  setEdit({ ...edit!, src: r.url });
                  setDirty(true);
                } catch (err) {
                  setError(adminError(err));
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
          {edit?.src && (
            <Image
              src={String(edit.src)}
              alt={String(edit.alt || "Pratinjau foto galeri")}
              width={480}
              height={320}
              unoptimized
              className="aspect-[3/2] w-full rounded-lg object-cover"
            />
          )}
        </div>
      )}

      {cafe && (
        <section className="grid gap-3">
          <h2 className="font-serif text-2xl">Jam operasional</h2>
          {hours.map((hour, i) => (
            <fieldset key={hour.day} className="grid grid-cols-1 gap-3 rounded-lg border border-offwhite/10 p-4 sm:grid-cols-2">
              <legend className="px-1 text-sm font-medium text-offwhite">{hour.day}</legend>
              <label className="flex min-h-11 items-center gap-3 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={hour.isOpen}
                  onChange={(e) => {
                    setHours(hours.map((h, n) => (n === i ? { ...h, isOpen: e.target.checked } : h)));
                    setDirty(true);
                  }}
                  className="h-5 w-5 accent-terracotta"
                />
                Buka
              </label>
              {(["openTime", "closeTime"] as const).map((key) => (
                <label key={key} className="grid gap-2 text-sm">
                  {key === "openTime" ? "Jam buka" : "Jam tutup"}
                  <input
                    type="time"
                    required={hour.isOpen}
                    disabled={!hour.isOpen}
                    className={`${adminInputClass} tabular-nums`}
                    value={String(hour[key] ?? "")}
                    onChange={(e) => {
                      setHours(hours.map((h, n) => (n === i ? { ...h, [key]: e.target.value } : h)));
                      setDirty(true);
                    }}
                  />
                </label>
              ))}
            </fieldset>
          ))}
        </section>
      )}

      {error && (
        <p role="alert" className="text-sm text-terracotta-light">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 flex flex-wrap gap-3 border-t border-offwhite/10 bg-charcoal py-4">
        <button disabled={busy} className={adminButtonClass}>
          {busy ? "Menyimpan…" : "Simpan perubahan"}
        </button>
        {cafe && (
          <button type="button" onClick={() => setPreview(!preview)} className={adminSecondaryClass}>
            {preview ? "Tutup pratinjau" : "Pratinjau"}
          </button>
        )}
        {!cafe && (
          <button type="button" onClick={close} className={adminSecondaryClass}>
            Batal
          </button>
        )}
      </div>

      {preview && (
        <article className="rounded-xl border border-offwhite/10 p-5">
          <h2 className="font-serif text-2xl">{edit?.name}</h2>
          <p className="mt-2">{edit?.tagline}</p>
          <p className="mt-4 text-sm text-offwhite-muted">
            {edit?.address} · {edit?.city}
          </p>
          <p className="mt-2 text-sm tabular-nums">{edit?.whatsappFormatted}</p>
        </article>
      )}
    </form>
  );

  if (loading) return <p role="status" className="p-6 text-sm text-offwhite-muted">Memuat konten…</p>;

  return (
    <div className="grid gap-5">
      {message && (
        <p role="status" className="rounded-lg border border-offwhite/10 p-4 text-sm">
          {message}
        </p>
      )}
      {error && !edit && (
        <p role="alert" className="text-sm text-terracotta-light">
          {error}
        </p>
      )}
      {cafe ? (
        <section className="rounded-xl border border-offwhite/10 bg-charcoal-light/30 p-4 md:p-6">{form}</section>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-offwhite-muted tabular-nums">{rows.length} entri</p>
            <button
              className={adminButtonClass}
              onClick={() => {
                setError("");
                setDirty(false);
                setEdit({
                  id: crypto.randomUUID(),
                  ...Object.fromEntries(fields.map((f) => [f.key, f.options?.[0] ?? (f.type === "number" ? 5 : "")])),
                });
              }}
            >
              Tambah {resource === "gallery" ? "foto" : "entri"}
            </button>
          </div>
          <section className="divide-y divide-offwhite/10 rounded-xl border border-offwhite/10">
            {rows.length === 0 ? (
              <p className="p-8 text-sm text-offwhite-muted">Belum ada konten. Tambahkan entri pertama.</p>
            ) : (
              rows.map((row, i) => (
                <article key={row.id} className="flex flex-wrap items-center gap-4 p-4 md:p-5">
                  {resource === "gallery" && row.src && (
                    <Image
                      src={String(row.src)}
                      alt={String(row.alt || row.title)}
                      width={80}
                      height={80}
                      unoptimized
                      className="h-20 w-20 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  {resource === "location" && (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-offwhite/15 bg-charcoal-light">
                      <LocationIconPreview icon={String(row.icon || "parking")} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-words font-semibold">{row.title || row.question || row.name}</h2>
                      {resource === "testimonials" && (
                        <span className="rounded-full border border-offwhite/15 px-2 py-0.5 text-xs text-offwhite-muted tabular-nums">
                          ★ {row.rating}/5 · {row.source}
                          {row.date ? ` · ${row.date}` : ""}
                        </span>
                      )}
                      {resource === "gallery" && row.category && (
                        <span className="rounded-full border border-offwhite/15 px-2 py-0.5 text-xs text-offwhite-muted">
                          {contentOptionLabels[String(row.category)] ?? row.category}
                          {row.aspect ? ` · ${contentOptionLabels[String(row.aspect)] ?? row.aspect}` : ""}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-offwhite-muted">
                      {row.comment || row.answer || row.description || row.caption || (row.category ? contentOptionLabels[String(row.category)] ?? row.category : "")}
                    </p>
                  </div>
                  <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                    <button
                      type="button"
                      disabled={busy || i === 0}
                      onClick={() => void move(i, -1)}
                      className={`${adminSecondaryClass} min-w-11`}
                      aria-label={`Pindahkan ${String(row.title || row.question || row.name)} ke atas`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={busy || i === rows.length - 1}
                      onClick={() => void move(i, 1)}
                      className={`${adminSecondaryClass} min-w-11`}
                      aria-label={`Pindahkan ${String(row.title || row.question || row.name)} ke bawah`}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setEdit({ ...row });
                        setDirty(false);
                        setError("");
                      }}
                      className={adminSecondaryClass}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className={adminSecondaryClass}
                      onClick={async () => {
                        if (!window.confirm("Hapus konten ini dari website?")) return;
                        const next = rows.filter((r) => r.id !== row.id);
                        if (await persist(next)) setRows(next);
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
          {edit && (
            <DashboardDialog title="Kelola konten" onClose={close}>
              {form}
            </DashboardDialog>
          )}
        </>
      )}
    </div>
  );
}
