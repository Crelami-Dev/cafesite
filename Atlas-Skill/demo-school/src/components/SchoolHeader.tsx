"use client";

import { useState, useRef } from "react";
import { animate, stagger } from "animejs";
import { prefersReducedMotion, releaseProps } from "@/lib/motion";

const NAV_ITEMS = [
  { href: "#kurikulum", label: "Peminatan" },
  { href: "#fasilitas", label: "Fasilitas" },
  { href: "#ppdb", label: "PPDB & Biaya" },
  { href: "#kunjungan", label: "Kunjungan" },
];

export function SchoolHeader() {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    const next = !open;
    setOpen(next);
    if (next && !prefersReducedMotion() && drawerRef.current) {
      requestAnimationFrame(() => {
        const links = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>("a") ?? []);
        if (links.length) {
          animate(links, {
            opacity: [0, 1],
            x: [-10, 0],
            duration: 240,
            delay: stagger(35),
            ease: "outCubic",
            onComplete: () => links.forEach(releaseProps),
          });
        }
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-forest/15 bg-chalk/95 backdrop-blur-sm">
      <div className="mx-auto flex min-h-16 max-w-[1180px] items-center justify-between gap-2 px-3 sm:px-4 md:gap-3 md:px-10">
        <a
          href="#top"
          className="inline-flex min-h-11 items-center gap-2 text-forest sm:gap-2.5"
          aria-label="Beranda SMA Aksara Nusantara"
        >
          <span
            className="grid size-7 shrink-0 place-items-center rounded-[6px] bg-forest font-serif text-xs font-bold text-chalk sm:size-8 sm:text-sm"
            aria-hidden="true"
          >
            AN
          </span>
          <span className="font-serif text-[15px] font-semibold tracking-tight whitespace-nowrap sm:text-lg">
            SMA Aksara<span className="hidden sm:inline"> Nusantara</span>
          </span>
        </a>

        <nav className="hidden items-center gap-5 md:flex lg:gap-7" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center whitespace-nowrap text-sm font-medium text-forest-muted transition-colors hover:text-forest"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <a
            href="#kunjungan"
            className="inline-flex min-h-11 items-center justify-center rounded-[6px] bg-ochre px-3 py-2 text-xs font-semibold text-white transition hover:bg-ochre-hover whitespace-nowrap sm:px-4 sm:text-sm"
          >
            Daftar PPDB
          </a>
          <button
            type="button"
            onClick={toggleMenu}
            aria-expanded={open}
            aria-controls="school-mobile-drawer"
            aria-label="Buka menu navigasi sekolah"
            className="inline-flex size-11 items-center justify-center rounded-[6px] border border-forest/25 bg-chalk-card text-forest md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="school-mobile-drawer"
          ref={drawerRef}
          className="border-t border-forest/15 bg-chalk px-4 py-3 md:hidden"
        >
          <nav className="grid gap-1" aria-label="Menu mobile sekolah">
            {NAV_ITEMS.map((item, idx) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center justify-between border-b border-forest/10 py-2 text-sm font-medium text-forest last:border-b-0"
              >
                <span>{item.label}</span>
                <span className="text-xs font-semibold text-ochre">0{idx + 1}</span>
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

