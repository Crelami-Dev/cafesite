"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export function PublicEffects(): null {
  const pathname = usePathname();
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "module";
    script.textContent =
      'const root=document.documentElement; root.dataset.type="place"; root.classList.add("m-enter"); root.classList.remove("m-enter-done"); setTimeout(()=>root.classList.add("m-enter-done"),700); const motion=await import("/assets/motion/motion.js"); motion.init();';
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [pathname]);
  return null;
}
