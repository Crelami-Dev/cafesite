"use client";

import { useState } from "react";
import type { AdminFloor, AdminTableForm } from "@/types";
import AdminField from "../AdminField";
import { adminButtonClass, adminInputClass, adminSecondaryClass } from "../admin-api";
import { useDialogFocus } from "../useDialogFocus";

interface TableFormModalProps {
  initial: AdminTableForm;
  floors: AdminFloor[];
  editing: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (table: AdminTableForm) => Promise<void>;
}

export default function TableFormModal({ initial, floors, editing, busy, onClose, onSave }: TableFormModalProps): React.JSX.Element {
  const [form, setForm] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [validation, setValidation] = useState("");

  function requestClose(): void {
    if (busy) return;
    if (!dirty || window.confirm("Buang perubahan meja yang belum disimpan?")) {
      onClose();
    }
  }

  useDialogFocus(requestClose);

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(form.id)) {
      setValidation("ID hanya boleh memakai huruf, angka, garis bawah, atau tanda hubung—tanpa spasi.");
      return;
    }
    setValidation("");
    void onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-charcoal-darkest/80 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="table-form-title" className="w-full max-w-lg rounded-xl border border-charcoal-border bg-charcoal p-5 shadow-floating md:p-6">
        <h2 id="table-form-title" className="font-serif text-2xl">{editing ? "Rapikan detail meja" : "Tambahkan meja"}</h2>
        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <AdminField label="ID meja" hint={editing ? "ID dikunci agar QR yang sudah dicetak tetap berlaku." : "Gunakan huruf, angka, _ atau -; misalnya L1-03."}>
            <input autoFocus={!editing} required maxLength={40} readOnly={editing} className={adminInputClass} value={form.id} placeholder="L1-03" onChange={(event) => { setForm({ ...form, id: event.target.value }); setDirty(true); }} />
          </AdminField>
          <AdminField label="Label yang terlihat">
            <input autoFocus={editing} required maxLength={80} className={adminInputClass} value={form.label} placeholder="Meja 03" onChange={(event) => { setForm({ ...form, label: event.target.value }); setDirty(true); }} />
          </AdminField>
          <AdminField label="Lantai">
            <select required className={adminInputClass} value={form.floorId} onChange={(event) => { setForm({ ...form, floorId: event.target.value }); setDirty(true); }}>
              {floors.map((floor) => <option key={floor.id} value={floor.id}>{floor.name}</option>)}
            </select>
          </AdminField>
          <AdminField label="Status">
            <select className={adminInputClass} value={form.status} onChange={(event) => { setForm({ ...form, status: event.target.value as AdminTableForm["status"] }); setDirty(true); }}>
              <option value="available">Tersedia</option>
              <option value="occupied">Terisi</option>
              <option value="dirty">Perlu dibersihkan</option>
            </select>
          </AdminField>
          {validation && <p role="alert" className="text-sm text-terracotta-light">{validation}</p>}
          <div className="mt-2 flex justify-end gap-3">
            <button type="button" className={adminSecondaryClass} onClick={requestClose}>Batal</button>
            <button disabled={busy} className={adminButtonClass}>{busy ? "Menyimpan…" : "Simpan meja"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
