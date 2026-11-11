"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useDialogFocus } from "./useDialogFocus";
import type { MenuCategory, MenuCategoryMeta, MenuItem } from "@/types";
import {
  adminButtonClass,
  adminError,
  adminInputClass,
  adminRequest,
  adminSecondaryClass,
} from "./admin-api";
import { menuCategories as defaultCategories } from "@/data/menu";

interface MenuFormModalProps {
  initial: MenuItem;
  initialSort: number;
  categories?: MenuCategoryMeta[];
  editing: boolean;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSave: (item: MenuItem, sortOrder: number) => Promise<void>;
  onManageCategories?: () => void;
}

export default function MenuFormModal({
  initial,
  initialSort,
  categories,
  editing,
  busy,
  error,
  onClose,
  onSave,
  onManageCategories,
}: MenuFormModalProps): React.JSX.Element {
  const [item, setItem] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  function requestClose(): void {
    if (busy || uploading) return;
    if (!dirty || window.confirm("Perubahan menu belum disimpan. Tutup formulir?")) {
      onClose();
    }
  }

  useDialogFocus(requestClose);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent): void => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const categoriesList =
    categories && categories.length > 0 ? categories : defaultCategories;

  function patch(next: Partial<MenuItem>): void {
    setItem((current) => ({ ...current, ...next }));
    setDirty(true);
  }

  async function upload(file: File): Promise<void> {
    if (file.size > 5_242_880 || !/^image\/(jpeg|png|webp|avif)$/.test(file.type)) {
      setUploadError("Foto harus JPG, PNG, WebP, atau AVIF maksimal 5 MB.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const form = new FormData();form.append("file",file);
      const {url}=await adminRequest<{url:string}>("upload",{method:"POST",body:form});
      setItem(current=>({...current,image:url}));
    } catch (cause: unknown) {
      setUploadError(adminError(cause));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-charcoal-darkest/80 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-form-title"
        className="my-8 w-full max-w-3xl rounded-xl border border-charcoal-border bg-charcoal p-5 shadow-floating md:p-6"
      >
        <div className="flex items-center justify-between gap-4 border-b border-charcoal-border pb-4">
          <h2 id="menu-form-title" className="font-serif text-2xl">
            {editing ? "Edit menu" : "Menu baru"}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            className="min-h-11 rounded-lg px-3 text-sm text-offwhite-muted hover:bg-charcoal-light hover:text-offwhite"
          >
            Tutup
          </button>
        </div>

        <form
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void onSave(item, initialSort);
          }}
        >
          <label className="grid gap-1.5 text-sm">
            Nama menu *
            <input
              required
              placeholder="mis. Caramel Macchiato"
              value={item.name}
              onChange={(event) => {
                const name = event.target.value;
                const autoId =
                  !editing && (!item.id || item.id === initial.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"))
                    ? name
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "")
                    : item.id;
                patch({ name, id: autoId });
              }}
              className={adminInputClass}
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            ID menu (unik) *
            <input
              required
              readOnly={editing}
              placeholder="mis. caramel-macchiato"
              value={item.id}
              onChange={(event) =>
                patch({
                  id: event.target.value.replace(/\s+/g, "-").toLowerCase(),
                })
              }
              className={`${adminInputClass} ${editing ? "cursor-not-allowed opacity-60" : ""}`}
            />
          </label>

          <label className="grid gap-1.5 text-sm sm:col-span-2">
            Deskripsi menu *
            <textarea
              required
              placeholder="Singkat, jelas, dan menjelaskan rasa atau racikan."
              value={item.description}
              onChange={(event) => patch({ description: event.target.value })}
              className={`${adminInputClass} min-h-20 resize-y`}
              rows={2}
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            Harga (Rp) *
            <input
              required
              type="number"
              min="0"
              placeholder="25000"
              value={item.price || ""}
              onChange={(event) => patch({ price: Number(event.target.value) })}
              className={`${adminInputClass} tabular-nums`}
            />
          </label>

          <div className="grid gap-1.5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="menu-category-select">Kategori *</label>
              {onManageCategories && (
                <button
                  type="button"
                  onClick={onManageCategories}
                  className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-medium text-offwhite-muted transition-colors hover:text-offwhite"
                >
                  + Kelola kategori
                </button>
              )}
            </div>

            <select
              id="menu-category-select"
              value={item.category}
              onChange={(event) =>
                patch({ category: event.target.value as MenuCategory })
              }
              className={adminInputClass}
            >
              {categoriesList.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                  className="bg-charcoal py-2 text-offwhite"
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <label className="grid gap-1.5 text-sm sm:col-span-2">
            Tag (pisahkan dengan koma)
            <input
              placeholder="mis. signature, dingin, manis"
              value={item.tags?.join(", ") ?? ""}
              onChange={(event) =>
                patch({
                  tags: event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                })
              }
              className={adminInputClass}
            />
          </label>

          <div className="grid gap-2 text-sm sm:col-span-2">
            <label htmlFor="menu-photo-input">Foto menu (opsional)</label>
            <input
              id="menu-photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              disabled={uploading}
              className="min-h-11 w-full rounded-xl border border-charcoal-border bg-charcoal-darkest px-3 py-2.5 text-xs text-offwhite-muted file:mr-3 file:rounded-lg file:border-0 file:bg-charcoal-light file:px-3 file:py-1.5 file:text-xs file:text-offwhite"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
              }}
            />
            {uploading && (
              <span role="status" className="text-xs text-offwhite-muted">
                Mengunggah foto…
              </span>
            )}
            {uploadError && (
              <span role="alert" className="text-xs text-terracotta-light">
                ! {uploadError}
              </span>
            )}
            {item.image && (
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-offwhite/10 bg-charcoal-darkest/50 p-3">
                <Image
                  src={item.image}
                  alt={`Pratinjau ${item.name || "menu"}`}
                  width={96}
                  height={72}
                  unoptimized
                  className="h-18 w-24 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-offwhite-muted">{item.image}</p>
                  <button
                    type="button"
                    onClick={() => patch({ image: undefined })}
                    className="mt-1 min-h-11 rounded-lg px-2 text-xs text-terracotta-light hover:text-offwhite"
                  >
                    Hapus foto
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1 sm:col-span-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-offwhite/10 px-3 text-sm text-offwhite-muted transition hover:text-offwhite">
              <input
                type="checkbox"
                checked={item.isAvailable !== false}
                onChange={(event) => patch({ isAvailable: event.target.checked })}
                className="h-5 w-5 cursor-pointer accent-terracotta"
              />
              Tersedia untuk dipesan
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-offwhite/10 px-3 text-sm text-offwhite-muted transition hover:text-offwhite">
              <input
                type="checkbox"
                checked={item.isFeatured === true}
                onChange={(event) => patch({ isFeatured: event.target.checked })}
                className="h-5 w-5 cursor-pointer accent-terracotta"
              />
              Tandai sebagai unggulan
            </label>
          </div>

          {error && (
            <p role="alert" className="text-sm text-terracotta-light sm:col-span-2">
              ! {error}
            </p>
          )}
          <div className="mt-2 flex flex-wrap justify-end gap-3 border-t border-charcoal-border/40 pt-4 sm:col-span-2">
            <button type="button" className={adminSecondaryClass} onClick={requestClose}>
              Batal
            </button>
            <button type="submit" disabled={busy || uploading} className={adminButtonClass}>
              {busy ? "Menyimpan…" : "Simpan menu"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
