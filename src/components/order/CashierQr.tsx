"use client";
import type { CashierQrProps } from "@/types";
import Image from "next/image";
import { useEffect, useState } from "react";
export function CashierQr({ payload }: CashierQrProps): React.JSX.Element {
  const [image, setImage] = useState("");
  useEffect(() => {
    let live = true;
    void import("qrcode")
      .then((module) =>
        module.default.toDataURL(payload, {
          margin: 4,
          width: 480,
          errorCorrectionLevel: "M",
        }),
      )
      .then((value) => {
        if (live) setImage(value);
      })
      .catch(() => {
        /* The order number remains a usable fallback. */
      });
    return () => {
      live = false;
    };
  }, [payload]);
  return (
    <div className="mx-auto mt-5 grid aspect-square w-60 max-w-full place-items-center rounded-lg bg-offwhite p-3">
      {image ? (
        <Image
          src={image}
          unoptimized
          alt="QR bukti pesanan untuk dipindai kasir"
          width={240}
          height={240}
          className="h-auto w-full"
        />
      ) : (
        <p className="px-3 text-center text-sm text-charcoal">
          QR sedang disiapkan. Kasir juga bisa mencari nomor pesanan.
        </p>
      )}
    </div>
  );
}
