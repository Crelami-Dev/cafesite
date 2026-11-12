"use client";
import { CustomerOrdersLink } from "@/components/order/CustomerOrdersLink";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePublicContent } from "./PublicContentProvider";
import { CloseIcon } from "@/components/ui/icons";

const links = [
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "Tentang" },
  { href: "/gallery", label: "Galeri" },
  { href: "/location", label: "Lokasi" },
];

export function Navbar(): React.JSX.Element {
  const { cafe } = usePublicContent();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Tutup menu kalau rute berubah (mis. tombol Back/Forward browser).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  const close = (restoreFocus = false): void => {
    setOpen(false);
    if (restoreFocus) toggle.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a,button")?.focus();

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const els = Array.from(
        panel.current?.querySelectorAll<HTMLElement>("a[href],button") ?? [],
      );
      const first = els[0];
      const last = els.at(-1);
      if (!panel.current?.contains(document.activeElement)) {
        e.preventDefault();
        first?.focus();
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    // Menu mobile otomatis tertutup kalau layar melebar ke desktop.
    const media = window.matchMedia("(min-width: 1024px)");
    const onMedia = (e: MediaQueryListEvent): void => {
      if (e.matches) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    media.addEventListener("change", onMedia);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      media.removeEventListener("change", onMedia);
    };
  }, [open]);

  return (
    <header className="site-header">
      <nav className="site-bar" aria-label="Navigasi utama">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-serif text-2xl tracking-tight"
          onClick={() => close()}
        >
          {cafe.name}
          <span className="ml-1 text-terracotta-light">.</span>
        </Link>

        <div className="site-links">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className="nav-link"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="site-actions">
          <CustomerOrdersLink compact className="text-xs sm:text-sm" />
          <Link
            href="/order"
            className="btn btn--primary btn--nav"
            data-order-action
          >
            Pesan menu ↗
          </Link>
          <button
            ref={toggle}
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label="Buka navigasi"
            onClick={() => setOpen(true)}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div
          ref={panel}
          id="mobile-navigation"
          className="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Navigasi"
        >
          <div className="mobile-navigation__head">
            <span className="font-serif text-2xl">{cafe.name}</span>
            <button
              type="button"
              className="nav-toggle"
              aria-label="Tutup navigasi"
              onClick={() => close(true)}
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <nav className="my-6 flex flex-col" aria-label="Menu seluler">
            <CustomerOrdersLink className="mobile-navigation__link" onClick={() => close()} />
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="mobile-navigation__link"
                onClick={() => close()}
                aria-current={pathname === link.href ? "page" : undefined}
              >
                {link.label}
                <span aria-hidden="true" className="text-base text-offwhite-muted">
                  →
                </span>
              </Link>
            ))}
          </nav>

          <Link
            href="/order"
            className="btn btn--primary"
            onClick={() => close()}
          >
            Pesan menu ↗
          </Link>
          <p className="mt-auto pt-8 text-sm leading-relaxed text-offwhite-muted">
            {cafe.address}
            <br />
            {cafe.city}
          </p>
        </div>
      )}
    </header>
  );
}
