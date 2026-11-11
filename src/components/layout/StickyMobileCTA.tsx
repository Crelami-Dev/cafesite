"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
export function StickyMobileCTA(): React.JSX.Element | null {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const check = (): void => {
      const actions = Array.from(
        document.querySelectorAll<HTMLElement>(
          "[data-order-action]:not(.site-header *)",
        ),
      );
      const shown = actions.some((el) => {
        const r = el.getBoundingClientRect();
        return r.top < innerHeight && r.bottom > 80;
      });
      setVisible(window.scrollY > 120 && !shown);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [pathname]);
  if (pathname.startsWith("/order")) return null;
  return (
    <nav
      className={`phone-action sm:hidden ${visible ? "phone-action--visible" : ""}`}
      aria-hidden={!visible}
      aria-label="Pemesanan cepat"
      inert={!visible}
    >
      <Link href="/order" className="btn btn--primary w-full">
        Pesan menu ↗
      </Link>
    </nav>
  );
}
