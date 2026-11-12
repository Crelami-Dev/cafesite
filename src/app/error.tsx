"use client";

import type { ErrorPageProps } from "@/types";

export default function ErrorPage({
  error,
  retry,
}: ErrorPageProps): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-6 py-16">
      <p className="text-sm text-terracotta-light">CafeSite</p>
      <h1 className="mt-4 font-serif text-4xl leading-tight">
        Halaman belum dapat dimuat.
      </h1>
      <p className="mt-5 text-base leading-relaxed text-offwhite-muted">
        Ada kendala saat membuka halaman ini. Silakan coba lagi atau hubungi staf kedai.
      </p>
      {error.digest && <p className="mt-3 text-sm text-offwhite-muted">Kode kendala: {error.digest}</p>}
      <button
        type="button"
        onClick={retry}
        className="mt-8 min-h-12 w-fit rounded-md bg-terracotta px-6 text-base text-offwhite"
      >
        Coba lagi
      </button>
    </main>
  );
}
