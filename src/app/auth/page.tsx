import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AuthLogin from "@/components/admin/AuthLogin";

export const metadata: Metadata = { title: "Masuk Dashboard", robots: { index: false, follow: false } };

/** Halaman masuk: foto kedai di kiri (≥ lg), form di kanan. Di mobile hanya form, satu kolom. */
export default function AuthPage(): React.JSX.Element {
  return (
    <div className="grid min-h-dvh bg-charcoal text-offwhite lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-charcoal-darkest lg:block">
        <Image
          src="/Image/hero/hero_interior.jpg"
          alt="Suasana interior kedai kopi yang hangat"
          fill
          priority
          sizes="(min-width: 1024px) 52vw, 0px"
          className="object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-charcoal-darkest/55" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link href="/" className="inline-flex min-h-11 items-center font-serif text-3xl text-offwhite-pure">
            CafeSite<span className="text-terracotta-light">.</span>
          </Link>
          <p className="max-w-sm font-serif text-3xl leading-snug text-offwhite-pure xl:text-4xl">
            Satu tempat untuk pesanan, menu, dan cerita kedai Anda.
          </p>
        </div>
      </aside>

      <main id="main-content" className="flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:px-14">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center self-start font-serif text-2xl text-offwhite lg:hidden"
        >
          CafeSite<span className="text-terracotta-light">.</span>
        </Link>
        <div className="grid flex-1 place-items-center py-10">
          <AuthLogin />
        </div>
        <p className="text-center text-xs text-offwhite-darker lg:text-left">
          Akses khusus admin dan staf kedai.
        </p>
      </main>
    </div>
  );
}
