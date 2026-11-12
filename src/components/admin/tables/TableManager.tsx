"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { AdminFloor, AdminFloorForm, AdminTable, AdminTableForm } from "@/types";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import AdminNotice from "../AdminNotice";
import { adminError, adminPeek, adminRequest, adminSecondaryClass } from "../admin-api";
import ModuleSkeleton from "../ui/ModuleSkeleton";
import ConfirmDeleteDialog from "../ConfirmDeleteDialog";
import { useKeyedFlight, useSingleFlight } from "../useSingleFlight";
import FloorTabs from "./FloorTabs";
import FloorFormModal from "./FloorFormModal";
import TableGrid from "./TableGrid";
import TableFormModal from "./TableFormModal";
import QrPanel from "./QrPanel";
import QrPrintAll from "./QrPrintAll";

interface TablesResponse {
  floors: AdminFloor[];
  tables: AdminTable[];
  /** false = server belum punya kunci QR (ORDER_ACCESS_SECRET), QR meja tidak bisa dibuat. */
  qrReady?: boolean;
}

const TABLES_PATH = "manage?resource=tables";

type Modal = { kind: "floor"; initial: AdminFloorForm } | { kind: "table"; initial: AdminTableForm; editing: boolean } | null;
type Deleting = { kind: "floor"; floor: AdminFloor } | { kind: "table"; table: AdminTable } | null;

const blankTable = (floorId: string): AdminTableForm => ({ id: "", floorId, label: "", status: "available" });

function patchRows<T extends { id: string }>(rows: T[], payload: RealtimePostgresChangesPayload<T>): T[] {
  if (payload.eventType === "DELETE") return rows.filter((row) => row.id !== payload.old.id);
  const next = payload.new as T;
  const index = rows.findIndex((row) => row.id === next.id);
  if (index < 0) return [...rows, next];
  return rows.map((row, rowIndex) => (rowIndex === index ? next : row));
}

export default function TableManager(): React.JSX.Element {
  // Data terakhir (bila ada) langsung ditampilkan; data baru dimuat di latar.
  const cached = adminPeek<TablesResponse>(TABLES_PATH);
  const [floors, setFloors] = useState<AdminFloor[]>(() => cached?.floors ?? []);
  const [tables, setTables] = useState<AdminTable[]>(() => cached?.tables ?? []);
  const [qrReady, setQrReady] = useState(() => cached?.qrReady !== false);
  const [activeFloor, setActiveFloor] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [qrTable, setQrTable] = useState<AdminTable | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!cached);
  const [deleting, setDeleting] = useState<Deleting>(null);
  // Penjaga klik ganda seketika (ref): simpan lantai/meja dan aksi per meja.
  const saveFlight = useSingleFlight();
  const rowFlight = useKeyedFlight();
  const busy = saveFlight.pending;
  const client = getBrowserSupabase();

  const load = useCallback(async (quiet = false): Promise<void> => {
    if (!quiet) setLoading(true);
    try {
      const result = await adminRequest<TablesResponse>(TABLES_PATH);
      setFloors(result.floors);
      setTables(result.tables);
      setQrReady(result.qrReady !== false);
      setError("");
    } catch (cause: unknown) {
      setError(adminError(cause));
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(Boolean(cached)); }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hanya saat pertama tampil
  }, [load]);

  useEffect(() => {
    if (!client) {
      const poll = (): void => {
        if (!document.hidden) void load(true);
      };
      const timer = window.setInterval(poll, 10000);
      document.addEventListener("visibilitychange", poll);
      return () => {
        window.clearInterval(timer);
        document.removeEventListener("visibilitychange", poll);
      };
    }
    const tableChannel = client
      .channel("admin-cafe-tables")
      .on<AdminTable>("postgres_changes", { event: "*", schema: "public", table: "cafe_tables" }, (payload) => setTables((current) => patchRows(current, payload)))
      .subscribe();
    const floorChannel = client
      .channel("admin-floors")
      .on<AdminFloor>("postgres_changes", { event: "*", schema: "public", table: "floors" }, (payload) => setFloors((current) => patchRows(current, payload).sort((a, b) => a.sort_order - b.sort_order)))
      .subscribe();
    return () => {
      void client.removeChannel(tableChannel);
      void client.removeChannel(floorChannel);
    };
  }, [client, load]);

  const selectedFloor = floors.some((floor) => floor.id === activeFloor) ? activeFloor : (floors[0]?.id ?? "");
  const visibleTables = useMemo(() => tables.filter((table) => table.floor_id === selectedFloor && table.order_mode !== "takeaway"), [selectedFloor, tables]);

  async function saveFloor(form: AdminFloorForm): Promise<void> {
    await saveFlight.run(async () => {
      setError("");
      try {
        await adminRequest("manage?resource=floors", { method: "PUT", body: JSON.stringify({ floor: form }) });
        setModal(null);
        setMessage(form.id ? "Nama lantai sudah diperbarui." : "Lantai baru siap diisi meja.");
        await load();
      } catch (cause: unknown) {
        setError(adminError(cause));
      }
    });
  }

  async function saveTable(form: AdminTableForm): Promise<void> {
    await saveFlight.run(async () => {
      setError("");
      try {
        await adminRequest("manage?resource=tables", { method: "PUT", body: JSON.stringify({ table: { ...form, x: 10, y: 10 } }) });
        setModal(null);
        setMessage("Detail meja sudah tersimpan.");
        await load();
      } catch (cause: unknown) {
        setError(adminError(cause));
      }
    });
  }

  function deleteFloor(floor: AdminFloor): void {
    const count = tables.filter((table) => table.floor_id === floor.id).length;
    if (count > 0) {
      setError(`Lantai ini masih punya ${count} meja. Pindahkan atau hapus semua meja di dalamnya terlebih dahulu.`);
      return;
    }
    setError("");
    setDeleting({ kind: "floor", floor });
  }

  /** Dipanggil dialog konfirmasi; melempar error bila gagal sehingga lantai tetap ada. */
  async function performDeleteFloor(floor: AdminFloor): Promise<void> {
    try {
      await adminRequest("manage?resource=floors", { method: "DELETE", body: JSON.stringify({ id: floor.id }) });
    } catch (cause: unknown) {
      const detail = adminError(cause);
      throw new Error(detail.startsWith("Data masih digunakan") ? "Lantai ini baru saja terisi meja. Pindahkan atau hapus meja tersebut, lalu coba lagi." : detail);
    }
    setMessage(`${floor.name} sudah dihapus.`);
    await load(true);
  }

  async function saveStatus(table: AdminTable, status: AdminTable["status"]): Promise<void> {
    await rowFlight.run(table.id, async () => {
      setError("");
      try {
        await adminRequest("manage?resource=tables", { method: "PUT", body: JSON.stringify({ table: { id: table.id, floorId: table.floor_id, label: table.label, status, x: 10, y: 10 } }) });
        setTables((current) => current.map((row) => (row.id === table.id ? { ...row, status } : row)));
        setMessage(status === "available" ? `${table.label} sudah siap dipakai kembali.` : `Status ${table.label} sudah diperbarui.`);
      } catch (cause: unknown) {
        setError(adminError(cause));
      }
    });
  }

  function deleteTable(table: AdminTable): void {
    setError("");
    setDeleting({ kind: "table", table });
  }

  /** Dipanggil dialog konfirmasi; baris meja baru hilang setelah server benar-benar menghapus. */
  async function performDeleteTable(table: AdminTable): Promise<void> {
    await adminRequest("manage?resource=tables", { method: "DELETE", body: JSON.stringify({ id: table.id }) });
    setTables((current) => current.filter((row) => row.id !== table.id));
    setMessage(`${table.label} sudah dihapus.`);
  }

  if (loading && floors.length === 0) {
    return <ModuleSkeleton />;
  }

  // Gagal memuat dan belum ada data: tampilkan kendalanya, bukan ajakan "buat lantai pertama".
  if (error && floors.length === 0) {
    return (
      <div className="grid gap-4">
        <AdminNotice message={error} error />
        <button type="button" className={adminSecondaryClass} onClick={() => void load()}>
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm leading-6 text-offwhite-muted">Atur meja per lantai, pantau statusnya, lalu cetak QR yang langsung membuka halaman pemesanan.</p>
        <QrPrintAll floors={floors} tables={tables} activeFloorId={selectedFloor} />
      </div>

      <AdminNotice message={error} error />
      <AdminNotice message={message} />
      {!qrReady && (
        <AdminNotice
          error
          message="QR meja belum aktif di situs ini: isi ORDER_ACCESS_SECRET (minimal 16 karakter) di pengaturan server, lalu deploy ulang."
        />
      )}

      {tables.filter(table => table.order_mode === "takeaway").map(source => <section key={source.id} className="rounded-xl border border-offwhite/20 bg-charcoal p-5 md:p-6"><h2 className="font-serif text-2xl">QR Bawa pulang</h2><p className="mt-2 text-sm leading-relaxed text-offwhite-muted">Kanal takeaway bersama. Setiap pelanggan punya pesanan dan tagihan sendiri; kanal ini tidak dihitung sebagai meja duduk.</p><button type="button" className="mt-4 min-h-11 rounded-md bg-terracotta px-5 text-sm" onClick={() => setQrTable(source)}>Lihat QR Bawa pulang</button></section>)}
      {floors.length === 0 ? (
        <section className="rounded-xl border border-dashed border-charcoal-border bg-charcoal p-8 text-center md:p-12">
          <h2 className="font-serif text-2xl">Mulai dari lantai pertama</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-offwhite-darker">Tambahkan nama lantai atau area, lalu susun meja yang tersedia di sana.</p>
          <button
            type="button"
            className="mt-5 min-h-11 rounded-xl bg-terracotta px-5 text-sm font-semibold transition hover:bg-terracotta-hover"
            onClick={() => setModal({ kind: "floor", initial: { name: "", sortOrder: 0 } })}
          >
            Tambahkan lantai pertama
          </button>
        </section>
      ) : (
        <>
          <FloorTabs
            floors={floors}
            activeId={selectedFloor}
            onSelect={setActiveFloor}
            onAdd={() => setModal({ kind: "floor", initial: { name: "", sortOrder: floors.length } })}
            onEdit={(floor) => setModal({ kind: "floor", initial: { id: floor.id, name: floor.name, sortOrder: floor.sort_order } })}
            onDelete={(floor) => deleteFloor(floor)}
          />
          <TableGrid
            tables={visibleTables}
            onAdd={() => setModal({ kind: "table", initial: blankTable(selectedFloor), editing: false })}
            onQr={setQrTable}
            onEdit={(table) => setModal({ kind: "table", editing: true, initial: { id: table.id, floorId: table.floor_id, label: table.label, status: table.status } })}
            pendingIds={rowFlight.pendingKeys}
            onClean={(table) => void saveStatus(table, "available")}
            onDelete={(table) => deleteTable(table)}
          />
        </>
      )}

      {modal?.kind === "floor" && <FloorFormModal initial={modal.initial} busy={busy} onClose={() => setModal(null)} onSave={saveFloor} />}
      {modal?.kind === "table" && <TableFormModal initial={modal.initial} floors={floors} editing={modal.editing} busy={busy} onClose={() => setModal(null)} onSave={saveTable} />}
      {deleting?.kind === "floor" && (
        <ConfirmDeleteDialog
          title="Hapus lantai"
          message={`Hapus "${deleting.floor.name}"? Lantai yang sudah dihapus tidak bisa dikembalikan.`}
          confirmLabel="Hapus lantai"
          onConfirm={() => performDeleteFloor(deleting.floor)}
          onClose={() => setDeleting(null)}
        />
      )}
      {deleting?.kind === "table" && (
        <ConfirmDeleteDialog
          title="Hapus meja"
          message={`Hapus "${deleting.table.label}"?${deleting.table.status === "occupied" ? " Meja sedang terisi; penghapusan ditolak bila masih ada pesanan aktif." : " QR meja ini tidak akan berlaku lagi."}`}
          confirmLabel="Hapus meja"
          onConfirm={() => performDeleteTable(deleting.table)}
          onClose={() => setDeleting(null)}
        />
      )}
      {qrTable && <QrPanel table={qrTable} floor={floors.find((floor) => floor.id === qrTable.floor_id)} onClose={() => setQrTable(null)} />}
    </div>
  );
}
