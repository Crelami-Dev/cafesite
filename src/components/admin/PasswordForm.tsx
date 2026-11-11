"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest, adminError, adminInputClass, adminButtonClass } from "./admin-api";

export default function PasswordForm(): React.JSX.Element {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="grid max-w-md gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        try {
          if (form.get("password") !== form.get("confirm")) {
            throw new Error("Konfirmasi kata sandi tidak cocok.");
          }
          await adminRequest("password", {
            method: "PUT",
            body: JSON.stringify({ current: form.get("current"), password: form.get("password") }),
          });
          router.replace("/auth");
          router.refresh();
        } catch (err) {
          setError(adminError(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-sm text-offwhite-muted">Setelah disimpan, masuk kembali menggunakan kata sandi baru.</p>
      {(
        [
          ["current", "Kata sandi saat ini"],
          ["password", "Kata sandi baru"],
          ["confirm", "Ulangi kata sandi baru"],
        ] as const
      ).map(([name, label]) => (
        <label key={name} className="grid gap-2 text-sm">
          {label}
          <input
            type="password"
            name={name}
            required
            minLength={name === "current" ? 1 : 12}
            maxLength={128}
            autoComplete={name === "current" ? "current-password" : "new-password"}
            className={adminInputClass}
          />
        </label>
      ))}
      {error && (
        <p role="alert" className="text-sm text-terracotta-light">
          {error}
        </p>
      )}
      <button disabled={busy} className={adminButtonClass}>
        {busy ? "Menyimpan…" : "Simpan kata sandi"}
      </button>
    </form>
  );
}
