"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminButtonClass, adminInputClass } from "./admin-api";
export default function AuthLogin(): React.JSX.Element {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function login(form: FormData): Promise<void> { setBusy(true); setError(""); const response = await fetch("/api/local-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: String(form.get("email")), password: String(form.get("password")) }) }); if (!response.ok) { setError("Email atau kata sandi tidak cocok."); setBusy(false); return; } router.replace("/dashboard"); router.refresh(); }
  return <main className="grid min-h-dvh place-items-center bg-charcoal-darkest p-6"><section className="w-full max-w-md rounded-2xl border border-charcoal-border bg-charcoal p-7"><Link href="/" className="font-serif text-3xl">CafeSite<span className="text-terracotta">.</span></Link><h1 className="mt-10 font-serif text-3xl">Masuk ke dashboard</h1><p className="mt-2 text-sm text-offwhite-muted">Khusus admin lokal.</p><form action={login} className="mt-7 space-y-5"><label className="block text-sm">Email<input className={`${adminInputClass} mt-2`} name="email" type="email" required autoComplete="username" /></label><label className="block text-sm">Kata sandi<input className={`${adminInputClass} mt-2`} name="password" type="password" required autoComplete="current-password" /></label>{error && <p role="alert" className="text-sm text-terracotta-light">{error}</p>}<button disabled={busy} className={`${adminButtonClass} w-full`}>{busy ? "Memeriksa…" : "Masuk"}</button></form></section></main>;
}
