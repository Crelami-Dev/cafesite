"use client";

import { useState } from "react";
import type { MenuCategory, MenuCategoryMeta, MenuItem } from "@/types";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { adminButtonClass, adminError, adminInputClass, adminRequest, adminSecondaryClass } from "./admin-api";
import { menuCategories as defaultCategories } from "@/data/menu";

interface MenuFormModalProps {
  initial: MenuItem;
  initialSort: number;
  categories?: MenuCategoryMeta[];
  editing: boolean;
  busy: boolean;
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
  onClose,
  onSave,
  onManageCategories,
}: MenuFormModalProps): React.JSX.Element {
  const [item, setItem] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const categoriesList = categories && categories.length > 0 ? categories : defaultCategories;

  async function upload(file: File): Promise<void> {
    if (file.size > 5_242_880 || !/^image\/(jpeg|png|webp|avif)$/.test(file.type)) {
      setUploadError("Foto harus JPG, PNG, WebP, atau AVIF maksimal 5 MB.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const client = getBrowserSupabase();
      if (client) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `menu/${crypto.randomUUID()}.${ext}`;
        const { error } = await client.storage.from("cafe-assets").upload(path, file, { contentType: file.type });
        if (error) throw error;
        setItem((current) => ({ ...current, image: client.storage.from("cafe-assets").getPublicUrl(path).data.publicUrl }));
      } else {
        // Mode lokal: simpan ke public/uploads/menu lewat API admin.
        const form = new FormData();
        form.append("file", file);
        const { url } = await adminRequest<{ url: string }>("upload", { method: "POST", body: form });
        setItem((current) => ({ ...current, image: url }));
      }
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
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-form-title"
        className="my-8 w-full max-w-3xl rounded-2xl border border-charcoal-border bg-charcoal p-5 shadow-floating md:p-6"
      >
        <h2 id="menu-form-title" className="font-serif text-2xl">
          {editing ? "Rapikan menu" : "Menu baru"}
        </h2>
        <form
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void onSave(item, initialSort);
          }}
        >
          <label className="grid gap-1.5 text-sm">
            Nama Menu *
            <input
              required
              placeholder="mis. Caramel Macchiato"
              value={item.name}
              onChange={(event) => setItem({ ...item, name: event.target.value })}
              className={adminInputClass}
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            ID Menu (unik) *
            <input
              required
              readOnly={editing}
              placeholder="mis. caramel-macchiato"
              value={item.id}
              onChange={(event) => setItem({ ...item, id: event.target.value.replace(/\s+/g, "-").toLowerCase() })}
              className={`${adminInputClass} ${editing ? "opacity-60 cursor-not-allowed" : ""}`}
            />
          </label>

          <label className="grid gap-1.5 text-sm sm:col-span-2">
            Deskripsi Menu *
            <textarea
              required
              placeholder="Singkat, menggugah selera, dan menjelaskan rasa atau racikan."
              value={item.description}
              onChange={(event) => setItem({ ...item, description: event.target.value })}
              className={`${adminInputClass} min-h-16 resize-none`}
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
              onChange={(event) => setItem({ ...item, price: Number(event.target.value) })}
              className={adminInputClass}
            />
          </label>

          {/* Kategori dengan Tampilan Select Kustom & Akses Cepat Kelola Kategori */}
          <div className="grid gap-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span>Kategori *</span>
              {onManageCategories && (
                <button
                  type="button"
                  onClick={onManageCategories}
                  className="text-xs text-latte hover:text-latte-light transition-colors font-medium"
                >
                  + Kelola Kategori
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={item.category}
                onChange={(event) => setItem({ ...item, category: event.target.value as MenuCategory })}
                className="min-h-11 w-full cursor-pointer appearance-none rounded-xl border border-charcoal-border bg-charcoal-darkest py-2.5 pl-3.5 pr-10 text-sm font-medium text-offwhite outline-none transition duration-150 hover:border-charcoal-muted focus:border-latte focus:ring-1 focus:ring-latte/40 disabled:opacity-50"
              >
                {categoriesList.map((category) => (
                  <option key={category.id} value={category.id} className="bg-charcoal py-2 text-offwhite">
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Panah Chevron Kustom */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-offwhite-darker">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <label className="grid gap-1.5 text-sm sm:col-span-2">
            Tag (pisahkan dengan koma)
            <input
              placeholder="mis. signature, dingin, manis"
              value={item.tags?.join(", ") ?? ""}
              onChange={(event) =>
                setItem({
                  ...item,
                  tags: event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                })
              }
              className={adminInputClass}
            />
          </label>

          <div className="grid gap-1.5 text-sm sm:col-span-2">
            <span>Foto Menu</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              disabled={uploading}
              className="min-h-11 w-full rounded-xl border border-charcoal-border bg-charcoal-darkest px-3 py-2.5 text-xs text-offwhite-muted file:mr-3 file:rounded-lg file:border-0 file:bg-charcoal-light file:px-3 file:py-1.5 file:text-xs file:text-offwhite-muted"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
              }}
            />
            {uploading && <span className="text-xs text-latte">Mengunggah foto…</span>}
            {uploadError && <span className="text-xs text-terracotta-light">{uploadError}</span>}
          </div>

          <div className="flex items-center gap-6 sm:col-span-2 pt-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-offwhite-muted hover:text-offwhite transition">
              <input
                type="checkbox"
                checked={item.isAvailable !== false}
                onChange={(event) => setItem({ ...item, isAvailable: event.target.checked })}
                className="h-4 w-4 accent-terracotta cursor-pointer"
              />
              Tersedia untuk dipesan
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-offwhite-muted hover:text-offwhite transition">
              <input
                type="checkbox"
                checked={item.isFeatured === true}
                onChange={(event) => setItem({ ...item, isFeatured: event.target.checked })}
                className="h-4 w-4 accent-terracotta cursor-pointer"
              />
              Tandai sebagai Unggulan
            </label>
          </div>

          <div className="mt-2 flex justify-end gap-3 sm:col-span-2 border-t border-charcoal-border/40 pt-4">
            <button type="button" className={adminSecondaryClass} onClick={onClose}>
              Batal
            </button>
            <button type="submit" disabled={busy} className={adminButtonClass}>
              {busy ? "Menyimpan…" : "Simpan menu"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
