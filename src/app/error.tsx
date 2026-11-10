"use client";

export default function ErrorPage({
  reset,
}: {
  reset: () => void;
}): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-6 py-16">
      <p className="text-sm text-terracotta-light">CafeSite</p>
      <h1 className="mt-4 font-serif text-4xl leading-tight">
        Data kedai belum dapat dimuat.
      </h1>
      <p className="mt-5 text-base leading-relaxed text-offwhite-muted">
        Koneksi ke kedai sedang bermasalah. Silakan coba lagi beberapa saat.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 min-h-12 w-fit rounded-md bg-terracotta px-6 text-base text-offwhite"
      >
        Coba lagi
      </button>
    </main>
  );
}
