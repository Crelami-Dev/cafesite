"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/ui/icons";

interface CopyAddressButtonProps {
  address: string;
  className?: string;
}

export function CopyAddressButton({
  address,
  className = "",
}: CopyAddressButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Alamat tersalin" : "Salin alamat ke papan klip"}
      className={`inline-flex items-center gap-1.5 rounded-md border border-charcoal-border/80 bg-charcoal px-3 py-1.5 text-xs font-medium text-offwhite-muted transition-all hover:border-terracotta/60 hover:text-offwhite hover:bg-charcoal-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta focus-visible:ring-2 focus-visible:ring-terracotta active:scale-95 ${className}`}
    >
      {copied ? (
        <>
          <CheckIcon className="h-3.5 w-3.5 text-terracotta" />
          <span className="text-terracotta">Tersalin!</span>
        </>
      ) : (
        <>
          <CopyIcon className="h-3.5 w-3.5 text-latte" />
          <span>Salin Alamat</span>
        </>
      )}
    </button>
  );
}
