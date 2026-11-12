"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRightIcon, EyeIcon, EyeOffIcon, WarningIcon } from "@/components/ui/icons";
import { adminButtonClass, adminInputClass } from "./admin-api";

/** Form masuk dashboard. Akun dicek ke database (SQLite lokal / Supabase), bukan ke file .env. */
export default function AuthLogin(): React.JSX.Element {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="w-full max-w-sm">
      <p className="text-xs font-medium uppercase tracking-widest text-terracotta-light">Ruang kelola</p>
      <h1 className="mt-3 font-serif text-3xl leading-tight text-offwhite sm:text-4xl">Selamat datang kembali</h1>
      <p className="mt-3 text-sm leading-relaxed text-offwhite-muted">
        Masuk dengan akun admin atau staf kedai untuk mengelola pesanan, menu, dan konten.
      </p>

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 grid gap-5" noValidate={false}>
        <label className="grid gap-2 text-sm font-medium text-offwhite">
          Email
          <input
            className={adminInputClass}
            name="email"
            type="email"
            inputMode="email"
            required
            autoFocus
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="nama@kedai.id"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-offwhite">
          Kata sandi
          <span className="relative block">
            <input
              className={`${adminInputClass} pr-12`}
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Kata sandi Anda"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-r-lg text-offwhite-muted transition hover:text-offwhite"
            >
              {showPassword ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
            </button>
          </span>
        </label>

        <div aria-live="polite">
          {error && (
            <p
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-terracotta-light/40 bg-terracotta/10 p-3 text-sm text-terracotta-light"
            >
              <WarningIcon className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <button type="submit" disabled={busy} className={`${adminButtonClass} min-h-12 w-full text-base`}>
          {busy ? "Memeriksa…" : "Masuk"}
        </button>
      </form>

      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm text-offwhite-muted transition hover:text-offwhite"
      >
        <ArrowRightIcon className="size-4 rotate-180" />
        Kembali ke website
      </Link>
    </div>
  );
}
