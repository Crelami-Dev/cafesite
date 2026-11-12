"use client";

import { useEffect, useRef } from "react";
import { setupScrollReveal } from "@/lib/motion";

export function SchoolClientMotion({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    return setupScrollReveal(containerRef.current);
  }, []);

  return <div ref={containerRef}>{children}</div>;
}

