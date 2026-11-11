"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initScrollReveal } from "@/lib/motion";

/** Memasang scroll reveal anime.js di halaman publik, diulang tiap pindah halaman. */
export function PublicMotion(): null {
  const pathname = usePathname();
  useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return;
    return initScrollReveal(main);
  }, [pathname]);
  return null;
}
