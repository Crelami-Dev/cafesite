"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminButtonClass, adminInputClass } from "./admin-api";

export default function AuthLogin(): React.JSX.Element {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/local-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error || "Email atau kata sandi tidak cocok.");
        setBusy(false);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Koneksi ke server terganggu. Coba lagi.");
      setBusy(false);
    }
  }

  return (
    <main id="main-content" className="grid min-h-dvh place-items-center bg-charcoal-darkest p-6">
      <section className="w-full max-w-md rounded-xl border border-charcoal-border bg-charcoal p-6 sm:p-8">
        <Link href="/" className="inline-flex min-h-11 items-center font-serif text-3xl text-offwhite">
          CafeSite<span className="text-terracotta">.</span>
        </Link>
        <h1 className="mt-8 font-serif text-3xl text-offwhite">Masuk ke ruang kelola</h1>
        <p className="mt-2 text-sm text-offwhite-muted">
          Gunakan akun pemilik atau staf kedai untuk melanjutkan.
        </p>
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-7 space-y-5">
          <label className="block text-sm text-offwhite">
            Email
            <input
              className={`${adminInputClass} mt-2`}
              name="email"
              type="email"
              required
              autoComplete="username"
            />
          </label>
          <label className="block text-sm text-offwhite">
            Kata sandi
            <input
              className={`${adminInputClass} mt-2`}
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          {error && (
            <p role="alert" className="rounded-lg border border-terracotta/50 bg-terracotta/10 p-3 text-sm text-terracotta-light">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className={`${adminButtonClass} w-full`}>
            {busy ? "Memeriksa…" : "Masuk"}
          </button>
        </form>
      </section>
    </main>
  );
}
