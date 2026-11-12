"use client";

import { useState } from "react";
import { useDialogFocus } from "./useDialogFocus";
import type { AdminMenuRecord, MenuCategoryMeta } from "@/types";
import { adminButtonClass, adminInputClass, adminSecondaryClass } from "./admin-api";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";

interface CategoryManagerModalProps {
  categories: MenuCategoryMeta[];
  records: AdminMenuRecord[];
  busy: boolean;
  onClose: () => void;
  onSaveCategories: (updatedCategories: MenuCategoryMeta[]) => Promise<void>;
}

export default function CategoryManagerModal({
  categories,
  records,
  busy,
  onClose,
  onSaveCategories,
}: CategoryManagerModalProps): React.JSX.Element {
  const [list, setList] = useState<MenuCategoryMeta[]>(categories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<MenuCategoryMeta | null>(null);

  const formDirty = Boolean(name.trim() || description.trim());

  function requestClose(): void {
    if (saving || busy) return;
    if (!formDirty || window.confirm("Perubahan kategori belum disimpan. Tutup dialog?")) {
      onClose();
    }
  }

  useDialogFocus(requestClose);

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleNameChange(val: string): void {
    setName(val);
    if (!editingId) {
      setSlug(slugify(val));
    }
  }

  function handleStartEdit(category: MenuCategoryMeta): void {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.id);
    setDescription(category.description);
    setError("");
  }

  function handleCancelForm(): void {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setError("");
  }

  async function handleFormSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanSlug = (slug || slugify(cleanName)).trim();

    if (!cleanName) {
      setError("Nama kategori wajib diisi.");
      return;
    }

    if (!cleanSlug) {
      setError("ID/Slug kategori tidak valid.");
      return;
    }

    let updatedList: MenuCategoryMeta[];

    if (editingId) {
      updatedList = list.map((item) =>
        item.id === editingId
          ? { ...item, name: cleanName, description: description.trim() }
          : item,
      );
    } else {
      if (list.some((item) => item.id === cleanSlug)) {
        setError(`Kategori dengan ID '${cleanSlug}' sudah ada.`);
        return;
      }
      const newCategory: MenuCategoryMeta = {
        id: cleanSlug,
        name: cleanName,
        description: description.trim(),
      };
      updatedList = [...list, newCategory];
    }

    setSaving(true);
    try {
      await onSaveCategories(updatedList);
      setList(updatedList);
      handleCancelForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan kategori.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMove(fromIndex: number, toIndex: number): Promise<void> {
    if (toIndex < 0 || toIndex >= list.length || fromIndex === toIndex) return;
    const nextList = [...list];
    const [moved] = nextList.splice(fromIndex, 1);
    nextList.splice(toIndex, 0, moved);

    setSaving(true);
    try {
      await onSaveCategories(nextList);
      setList(nextList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memindahkan urutan kategori.");
    } finally {
      setSaving(false);
    }
  }

  /** Buka dialog konfirmasi (yang menunggu sampai kategori benar-benar terhapus). */
  function handleDelete(category: MenuCategoryMeta): void {
    if (list.length <= 1) {
      setError("Minimal harus ada 1 kategori.");
      return;
    }
    setError("");
    setDeleting(category);
  }

  async function performDelete(category: MenuCategoryMeta): Promise<void> {
    const nextList = list.filter((item) => item.id !== category.id);
    await onSaveCategories(nextList); // melempar error bila gagal: kategori tetap ada
    setList(nextList);
    if (editingId === category.id) handleCancelForm();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-darkest/80 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
        className="flex max-h-[90dvh] w-full max-w-xl flex-col rounded-xl border border-charcoal-border bg-charcoal p-5 shadow-floating md:p-6"
      >
        <div className="flex items-start justify-between border-b border-charcoal-border/50 pb-4">
          <div>
            <h2
              id="category-modal-title"
              className="font-serif text-2xl font-medium tracking-tight text-offwhite"
            >
              Kelola kategori menu
            </h2>
            <p className="mt-1 text-xs text-offwhite-muted sm:text-sm">
              Sesuaikan nama, deskripsi, atau tambah kategori baru sesuai konsep kafe Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="min-h-11 rounded-lg px-3 text-sm text-offwhite-muted transition hover:bg-charcoal-light hover:text-offwhite"
          >
            Tutup
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto py-4">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-terracotta/40 bg-terracotta/10 p-3 text-xs text-terracotta-light"
            >
              ! {error}
            </div>
          )}

          <form
            onSubmit={(e) => void handleFormSubmit(e)}
            className="rounded-xl border border-charcoal-border/70 bg-charcoal-darkest/40 p-4"
          >
            <h3 className="mb-3 text-sm font-semibold text-offwhite">
              {editingId ? `Edit kategori: ${name}` : "Tambah kategori baru"}
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs text-offwhite-muted">
                Nama kategori *
                <input
                  type="text"
                  placeholder="mis. Mocktail, Manual Brew"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={adminInputClass}
                  required
                />
              </label>

              <label className="grid gap-1.5 text-xs text-offwhite-muted">
                ID / Slug
                <input
                  type="text"
                  placeholder="mis. manual-brew"
                  value={slug}
                  disabled={Boolean(editingId)}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  className={`${adminInputClass} disabled:opacity-50`}
                />
              </label>

              <label className="grid gap-1.5 text-xs text-offwhite-muted sm:col-span-2">
                Deskripsi singkat
                <input
                  type="text"
                  placeholder="mis. Seduhan segar buah dan rempah dingin"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={adminInputClass}
                />
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className={adminSecondaryClass}
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={saving || busy}
                className={adminButtonClass}
              >
                {saving ? "Menyimpan…" : editingId ? "Perbarui kategori" : "+ Tambah kategori"}
              </button>
            </div>
          </form>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-terracotta">
                Daftar kategori aktif ({list.length})
              </span>
              <span className="text-xs text-offwhite-darker">Gunakan panah untuk urutan</span>
            </div>

            <div className="divide-y divide-charcoal-border/30 rounded-xl border border-charcoal-border bg-charcoal-darkest/30">
              {list.map((category, index) => {
                const count = records.filter((r) => r.data.category === category.id).length;
                const isSelected = editingId === category.id;

                return (
                  <div
                    key={category.id}
                    className={`flex flex-wrap items-center justify-between gap-3 p-3 transition ${
                      isSelected ? "bg-charcoal-light/30" : "hover:bg-charcoal-light/10"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-sans text-sm font-semibold text-offwhite sm:text-base">
                          {category.name}
                        </span>
                        <span className="rounded bg-charcoal-light px-1.5 py-0.5 font-mono text-[11px] text-offwhite-darker">
                          {category.id}
                        </span>
                        <span className="rounded-full border border-charcoal-border/80 px-2 py-0.5 text-[11px] tabular-nums text-offwhite">
                          {count} menu
                        </span>
                      </div>
                      {category.description && (
                        <p className="mt-0.5 truncate text-xs text-offwhite-muted">
                          {category.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={index === 0 || saving}
                        onClick={() => void handleMove(index, index - 1)}
                        aria-label={`Geser ${category.name} ke atas`}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-charcoal-border text-sm text-offwhite-muted hover:border-offwhite/40 hover:text-offwhite disabled:opacity-25"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={index === list.length - 1 || saving}
                        onClick={() => void handleMove(index, index + 1)}
                        aria-label={`Geser ${category.name} ke bawah`}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-charcoal-border text-sm text-offwhite-muted hover:border-offwhite/40 hover:text-offwhite disabled:opacity-25"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleStartEdit(category)}
                        className="min-h-11 rounded-xl border border-charcoal-border px-3 text-xs text-offwhite-muted transition hover:border-offwhite/40 hover:text-offwhite"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleDelete(category)}
                        className="min-h-11 rounded-xl border border-charcoal-border px-3 text-xs text-terracotta-light transition hover:border-terracotta/60 hover:bg-terracotta/10"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-charcoal-border/50 pt-4">
          <p className="text-xs text-offwhite-darker">
            Perubahan kategori langsung diterapkan pada formulir dan halaman menu.
          </p>
          <button
            type="button"
            onClick={requestClose}
            className={`${adminSecondaryClass} text-xs`}
          >
            Selesai
          </button>
        </div>
      </section>

      {deleting && (
        <ConfirmDeleteDialog
          title="Hapus kategori"
          message={`Hapus kategori "${deleting.name}"?${records.some((r) => r.data.category === deleting.id) ? ` Perhatian: ${records.filter((r) => r.data.category === deleting.id).length} menu masih memakai kategori ini.` : ""}`}
          confirmLabel="Hapus kategori"
          onConfirm={() => performDelete(deleting)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
