"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { AdminFloor, AdminFloorForm, AdminTable, AdminTableForm } from "@/types";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import AdminNotice from "../AdminNotice";
import { adminError, adminRequest } from "../admin-api";
import FloorTabs from "./FloorTabs";
import FloorFormModal from "./FloorFormModal";
import TableGrid from "./TableGrid";
import TableFormModal from "./TableFormModal";
import QrPanel from "./QrPanel";
import QrPrintAll from "./QrPrintAll";

interface TablesResponse {
  floors: AdminFloor[];
  tables: AdminTable[];
}

type Modal = { kind: "floor"; initial: AdminFloorForm } | { kind: "table"; initial: AdminTableForm; editing: boolean } | null;

const blankTable = (floorId: string): AdminTableForm => ({ id: "", floorId, label: "", status: "available" });

function patchRows<T extends { id: string }>(rows: T[], payload: RealtimePostgresChangesPayload<T>): T[] {
  if (payload.eventType === "DELETE") return rows.filter((row) => row.id !== payload.old.id);
  const next = payload.new as T;
  const index = rows.findIndex((row) => row.id === next.id);
  if (index < 0) return [...rows, next];
  return rows.map((row, rowIndex) => (rowIndex === index ? next : row));
}

export default function TableManager(): React.JSX.Element {
  const [floors, setFloors] = useState<AdminFloor[]>([]);
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [activeFloor, setActiveFloor] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [qrTable, setQrTable] = useState<AdminTable | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const client = getBrowserSupabase();

  const load = useCallback(async (quiet = false): Promise<void> => {
    if (!quiet) setLoading(true);
    try {
      const result = await adminRequest<TablesResponse>("manage?resource=tables");
      setFloors(result.floors);
      setTables(result.tables);
      setError("");
    } catch (cause: unknown) {
      setError(adminError(cause));
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!client) {
      const poll = (): void => {
        if (!document.hidden) void load(true);
      };
      const timer = window.setInterval(poll, 5000);
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
  const visibleTables = useMemo(() => tables.filter((table) => table.floor_id === selectedFloor), [selectedFloor, tables]);

  async function saveFloor(form: AdminFloorForm): Promise<void> {
    setBusy(true);
    setError("");
    try {
      await adminRequest("manage?resource=floors", { method: "PUT", body: JSON.stringify({ floor: form }) });
      setModal(null);
      setMessage(form.id ? "Nama lantai sudah diperbarui." : "Lantai baru siap diisi meja.");
      await load();
    } catch (cause: unknown) {
      setError(adminError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function saveTable(form: AdminTableForm): Promise<void> {
    setBusy(true);
    setError("");
    try {
      await adminRequest("manage?resource=tables", { method: "PUT", body: JSON.stringify({ table: { ...form, x: 10, y: 10 } }) });
      setModal(null);
      setMessage("Detail meja sudah tersimpan.");
      await load();
    } catch (cause: unknown) {
      setError(adminError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function deleteFloor(floor: AdminFloor): Promise<void> {
    const count = tables.filter((table) => table.floor_id === floor.id).length;
    if (count > 0) {
      setError(`Lantai ini masih punya ${count} meja. Pindahkan atau hapus semua meja di dalamnya terlebih dahulu.`);
      return;
    }
    if (!confirm(`Hapus ${floor.name}? Lantai yang sudah dihapus tidak bisa dikembalikan.`)) return;
    try {
      await adminRequest("manage?resource=floors", { method: "DELETE", body: JSON.stringify({ id: floor.id }) });
      setError("");
      setMessage(`${floor.name} sudah dihapus.`);
      await load();
    } catch (cause: unknown) {
      const detail = adminError(cause);
      setError(detail.startsWith("Data masih digunakan") ? "Lantai ini baru saja terisi meja. Pindahkan atau hapus meja tersebut, lalu coba lagi." : detail);
    }
  }

  async function saveStatus(table: AdminTable, status: AdminTable["status"]): Promise<void> {
    setError("");
    try {
      await adminRequest("manage?resource=tables", { method: "PUT", body: JSON.stringify({ table: { id: table.id, floorId: table.floor_id, label: table.label, status, x: 10, y: 10 } }) });
      setTables((current) => current.map((row) => (row.id === table.id ? { ...row, status } : row)));
      setMessage(`${table.label} sudah siap dipakai kembali.`);
    } catch (cause: unknown) {
      setError(adminError(cause));
    }
  }

  async function deleteTable(table: AdminTable): Promise<void> {
    const warning = table.status === "occupied" ? " Meja sedang ditandai terisi; penghapusan akan ditolak bila masih ada pesanan aktif." : "";
    if (!confirm(`Hapus ${table.label}?${warning}`)) return;
    setError("");
    try {
      await adminRequest("manage?resource=tables", { method: "DELETE", body: JSON.stringify({ id: table.id }) });
      setTables((current) => current.filter((row) => row.id !== table.id));
      setMessage(`${table.label} sudah dihapus.`);
    } catch (cause: unknown) {
      setError(adminError(cause));
    }
  }

  if (loading && floors.length === 0) {
    return (
      <section className="rounded-xl border border-charcoal-border bg-charcoal p-6">
        <p role="status" className="text-sm text-offwhite-muted">Menyiapkan daftar lantai dan meja…</p>
      </section>
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
            onDelete={(floor) => void deleteFloor(floor)}
          />
          <TableGrid
            tables={visibleTables}
            onAdd={() => setModal({ kind: "table", initial: blankTable(selectedFloor), editing: false })}
            onQr={setQrTable}
            onEdit={(table) => setModal({ kind: "table", editing: true, initial: { id: table.id, floorId: table.floor_id, label: table.label, status: table.status } })}
            onClean={(table) => void saveStatus(table, "available")}
            onDelete={(table) => void deleteTable(table)}
          />
        </>
      )}

      {modal?.kind === "floor" && <FloorFormModal initial={modal.initial} busy={busy} onClose={() => setModal(null)} onSave={saveFloor} />}
      {modal?.kind === "table" && <TableFormModal initial={modal.initial} floors={floors} editing={modal.editing} busy={busy} onClose={() => setModal(null)} onSave={saveTable} />}
      {qrTable && <QrPanel table={qrTable} floor={floors.find((floor) => floor.id === qrTable.floor_id)} onClose={() => setQrTable(null)} />}
    </div>
  );
}
