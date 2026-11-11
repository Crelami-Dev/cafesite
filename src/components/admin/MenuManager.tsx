"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { AdminMenuRecord, MenuCategory, MenuCategoryMeta, MenuItem } from "@/types";
import { menuCategories as defaultCategories } from "@/data/menu";
import {
  adminButtonClass,
  adminError,
  adminInputClass,
  adminRequest,
  adminSecondaryClass,
} from "./admin-api";
import AdminNotice from "./AdminNotice";
import { CupIcon, PlusIcon, SearchIcon } from "@/components/ui/icons";
import EmptyState from "./ui/EmptyState";
import PageHeader from "./ui/PageHeader";
import SegmentedTabs from "./ui/SegmentedTabs";
import Skeleton from "./ui/Skeleton";
import MenuFormModal from "./MenuFormModal";
import MenuCategoryGroup from "./MenuCategoryGroup";
import CategoryManagerModal from "./CategoryManagerModal";

const blank: MenuItem = {
  id: "",
  name: "",
  description: "",
  price: 0,
  category: "coffee",
  tags: [],
  isFeatured: false,
  isAvailable: true,
};

type Modal = { initial: MenuItem; initialSort: number; editing: boolean } | null;

export default function MenuManager(): React.JSX.Element {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const query = params.get("q") || "";
  const categoryFilter = params.get("category") || "";
  const availability = params.get("availability") || "";

  const [rows, setRows] = useState<AdminMenuRecord[]>([]);
  const [categories, setCategories] = useState<MenuCategoryMeta[]>(defaultCategories);
  const [modal, setModal] = useState<Modal>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try {
      const [menuResult, catResult] = await Promise.allSettled([
        adminRequest<{ data: AdminMenuRecord[] }>("manage?resource=menu"),
        adminRequest<{ data: MenuCategoryMeta[] | null }>("manage?resource=categories"),
      ]);

      let currentRows: AdminMenuRecord[] = [];
      if (menuResult.status === "fulfilled") {
        currentRows = menuResult.value.data;
        setRows(currentRows);
      } else {
        setError(adminError(menuResult.reason));
      }

      let activeCats = defaultCategories;
      if (
        catResult.status === "fulfilled" &&
        Array.isArray(catResult.value.data) &&
        catResult.value.data.length > 0
      ) {
        activeCats = catResult.value.data;
      }

      const existingCatIds = new Set(activeCats.map((c) => c.id));
      const extraCats: MenuCategoryMeta[] = [];
      currentRows.forEach((r) => {
        const catId = r.data.category;
        if (catId && !existingCatIds.has(catId)) {
          existingCatIds.add(catId);
          extraCats.push({
            id: catId,
            name: catId.charAt(0).toUpperCase() + catId.slice(1).replace(/-/g, " "),
            description: "",
          });
        }
      });

      setCategories([...activeCats, ...extraCats]);
    } catch (cause: unknown) {
      setError(adminError(cause));
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

  async function save(item: MenuItem, sortOrder: number): Promise<void> {
    setBusy(true);
    setError("");
    try {
      await adminRequest("manage?resource=menu", {
        method: "PUT",
        body: JSON.stringify({ item, sortOrder }),
      });
      setMessage(
        modal?.editing
          ? "Perubahan menu sudah tersimpan."
          : "Menu baru sudah tersimpan dan langsung dipublikasikan.",
      );
      setModal(null);
      await load();
    } catch (cause: unknown) {
      setError(adminError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function remove(record: AdminMenuRecord): Promise<void> {
    if (!window.confirm(`Hapus ${record.data.name}?`)) return;
    setError("");
    try {
      await adminRequest("manage?resource=menu", {
        method: "DELETE",
        body: JSON.stringify({ id: record.id }),
      });
      setRows((current) => current.filter((row) => row.id !== record.id));
      setMessage(`${record.data.name} sudah dihapus.`);
    } catch (cause: unknown) {
      setError(adminError(cause));
    }
  }

  async function toggleAvailable(record: AdminMenuRecord, available: boolean): Promise<void> {
    setError("");
    const previous = rows;
    setRows((current) => current.map((r) => (r.id === record.id ? { ...r, is_available: available } : r)));
    try {
      await adminRequest("manage?resource=menu", {
        method: "PUT",
        body: JSON.stringify({ item: { ...record.data, isAvailable: available }, sortOrder: record.sort_order }),
      });
      setMessage(`${record.data.name} ${available ? "tersedia lagi" : "ditandai habis"}.`);
    } catch (cause: unknown) {
      setRows(previous);
      setError(adminError(cause));
    }
  }

  function setFilter(values: Record<string, string>): void {
    const p = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(values)) {
      if (value) p.set(key, value);
      else p.delete(key);
    }
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  async function handleReorder(
    category: MenuCategory,
    updatedCategoryRecords: AdminMenuRecord[],
  ): Promise<void> {
    const combinedRows: AdminMenuRecord[] = [];
    categories.forEach((cat) => {
      if (cat.id === category) {
        combinedRows.push(...updatedCategoryRecords);
      } else {
        combinedRows.push(...rows.filter((r) => r.data.category === cat.id));
      }
    });

    const rowsWithSort = combinedRows.map((r, idx) => ({ ...r, sort_order: idx }));
    setRows(rowsWithSort);

    const reorderPayload = updatedCategoryRecords.map((r) => {
      const globalIdx = rowsWithSort.findIndex((item) => item.id === r.id);
      return { id: r.id, sort_order: globalIdx >= 0 ? globalIdx : 0 };
    });

    try {
      await adminRequest("manage?resource=menu", {
        method: "PUT",
        body: JSON.stringify({ reorder: reorderPayload }),
      });
      setMessage("Urutan menu berhasil diperbarui.");
    } catch (cause: unknown) {
      setError(adminError(cause));
      await load();
    }
  }

  async function handleSaveCategories(updatedCategories: MenuCategoryMeta[]): Promise<void> {
    setBusy(true);
    setError("");
    try {
      await adminRequest("manage?resource=categories", {
        method: "PUT",
        body: JSON.stringify({ data: updatedCategories }),
      });
      setCategories(updatedCategories);
      setMessage("Daftar kategori berhasil disimpan.");
    } catch (cause: unknown) {
      setError(adminError(cause));
      throw cause;
    } finally {
      setBusy(false);
    }
  }

  if (loading && rows.length === 0 && !error) {
    return (
      <div className="grid gap-3" aria-busy="true">
        <Skeleton className="h-12" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const visibleGroups = categories
    .map((category) => ({
      category,
      records: rows.filter(
        (row) =>
          row.data.category === category.id &&
          (!categoryFilter || categoryFilter === category.id) &&
          (!query ||
            row.data.name.toLowerCase().includes(query.toLowerCase()) ||
            row.data.description?.toLowerCase().includes(query.toLowerCase())) &&
          (!availability || row.is_available === (availability === "available")),
      ),
    }))
    .filter((group) => group.records.length > 0);

  const hasFilter = Boolean(query || categoryFilter || availability);

  return (
    <div className="grid gap-4 md:gap-5">
      <PageHeader
        title="Menu kedai"
        description="Perubahan langsung tampil di halaman pemesanan dan situs kedai."
        actions={
          <>
            <button type="button" className={adminSecondaryClass} onClick={() => setCategoryModalOpen(true)}>
              Kategori ({categories.length})
            </button>
            <button
              type="button"
              className={adminButtonClass}
              onClick={() =>
                setModal({
                  initial: {
                    ...blank,
                    category: (categories[0]?.id as MenuCategory) || "coffee",
                    id: "",
                  },
                  initialSort: rows.length,
                  editing: false,
                })
              }
            >
              <PlusIcon className="size-4" /> Tambah menu
            </button>
          </>
        }
      />

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setFilter({ q: String(new FormData(e.currentTarget).get("q") || "").trim() });
        }}
      >
        <label className="relative block">
          <span className="sr-only">Cari menu</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-offwhite-darker" />
          <input
            key={query}
            name="q"
            defaultValue={query}
            placeholder="Cari nama atau deskripsi menu"
            className={`${adminInputClass} pl-9`}
            onBlur={(e) => {
              if (e.currentTarget.value.trim() !== query) setFilter({ q: e.currentTarget.value.trim() });
            }}
          />
        </label>
      </form>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div role="group" aria-label="Filter kategori" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          {[{ id: "", name: "Semua" }, ...categories].map((c) => {
            const active = categoryFilter === c.id;
            return (
              <button
                key={c.id || "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter({ category: c.id })}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm transition ${
                  active
                    ? "border-terracotta bg-terracotta text-offwhite-pure"
                    : "border-offwhite/20 text-offwhite-muted hover:border-offwhite/40 hover:text-offwhite"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
        <div className="lg:w-72">
          <SegmentedTabs
            label="Filter ketersediaan"
            value={(availability || "all") as "all" | "available" | "unavailable"}
            options={[
              { value: "all", label: "Semua" },
              { value: "available", label: "Tersedia" },
              { value: "unavailable", label: "Habis" },
            ]}
            onChange={(v) => setFilter({ availability: v === "all" ? "" : v })}
          />
        </div>
      </div>

      <AdminNotice message={error} error />
      <AdminNotice message={message} />

      {rows.length === 0 ? (
        <EmptyState
          icon={<CupIcon className="size-8" />}
          title="Belum ada menu"
          hint="Tambahkan menu pertama agar bisa dipesan."
        />
      ) : visibleGroups.length === 0 ? (
        <EmptyState
          title="Tidak ada menu yang cocok"
          hint="Coba kata kunci lain."
          action={
            hasFilter ? (
              <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className={adminSecondaryClass}>
                Hapus filter
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4">
          {visibleGroups.map(({ category, records }) => (
            <MenuCategoryGroup
              key={category.id}
              category={category.id}
              name={category.name}
              description={category.description}
              records={records}
              onEdit={(record) =>
                setModal({
                  initial: { ...record.data, isAvailable: record.is_available },
                  initialSort: record.sort_order,
                  editing: true,
                })
              }
              onRemove={(record) => void remove(record)}
              onToggleAvailable={(record, value) => void toggleAvailable(record, value)}
              onReorder={(reordered) => void handleReorder(category.id, reordered)}
            />
          ))}
        </div>
      )}

      {modal && (
        <MenuFormModal
          initial={modal.initial}
          initialSort={modal.initialSort}
          categories={categories}
          editing={modal.editing}
          busy={busy}
          error={error}
          onClose={() => setModal(null)}
          onSave={save}
          onManageCategories={() => {
            setCategoryModalOpen(true);
          }}
        />
      )}

      {categoryModalOpen && (
        <CategoryManagerModal
          categories={categories}
          records={rows}
          busy={busy}
          onClose={() => setCategoryModalOpen(false)}
          onSaveCategories={handleSaveCategories}
        />
      )}
    </div>
  );
}
