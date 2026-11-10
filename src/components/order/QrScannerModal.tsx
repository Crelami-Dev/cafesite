"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloseIcon } from "@/components/ui/icons";

interface BarcodeDetectorResult {
  rawValue: string;
}

interface BarcodeDetectorInstance {
  detect: (source: CanvasImageSource) => Promise<BarcodeDetectorResult[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats: string[] }): BarcodeDetectorInstance;
  getSupportedFormats?: () => Promise<string[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

interface QrScannerModalProps {
  onClose: () => void;
}

type ScanState = "starting" | "scanning" | "unsupported" | "denied" | "error";

function extractTableCode(rawValue: string): string | null {
  try {
    const url = new URL(rawValue, window.location.origin);
    const meja = url.searchParams.get("meja");
    return meja ? meja.slice(0, 60) : null;
  } catch {
    return null;
  }
}

export function QrScannerModal({
  onClose,
}: QrScannerModalProps): React.JSX.Element {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [state, setState] = useState<ScanState>("starting");

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const key = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const buttons = Array.from(
          dialogRef.current?.querySelectorAll<HTMLButtonElement>("button") ??
            [],
        );
        if (event.shiftKey && document.activeElement === buttons[0]) {
          event.preventDefault();
          buttons.at(-1)?.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === buttons.at(-1)
        ) {
          event.preventDefault();
          buttons[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose]);

  const stopCamera = useCallback((): void => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!window.BarcodeDetector) {
      const timer = window.setTimeout(() => setState("unsupported"), 0);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

    async function start(): Promise<void> {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setState("scanning");

        const scan = async (): Promise<void> => {
          if (cancelled || !video) return;
          try {
            const results = await detector.detect(video);
            const tableCode = results
              .map((result) => extractTableCode(result.rawValue))
              .find((code) => code);
            if (tableCode) {
              stopCamera();
              router.push(`/order?meja=${encodeURIComponent(tableCode)}`);
              onClose();
              return;
            }
          } catch {
            // Frame gagal dibaca—coba lagi di frame berikutnya, tidak perlu hentikan sesi.
          }
          frameRef.current = requestAnimationFrame(() => {
            void scan();
          });
        };
        void scan();
      } catch (cause) {
        if (cancelled) return;
        setState(
          cause instanceof DOMException && cause.name === "NotAllowedError"
            ? "denied"
            : "error",
        );
      }
    }

    void start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [router, stopCamera, onClose]);

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[110] grid place-items-center bg-charcoal-darkest/95 p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Pindai kode QR meja"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup pemindai"
        className="absolute right-5 top-5 inline-flex h-12 w-12 items-center justify-center rounded-md border border-offwhite/30 text-offwhite transition-colors hover:border-offwhite/60"
      >
        <CloseIcon className="h-4 w-4" />
      </button>

      <div className="w-full max-w-sm text-center">
        {state === "unsupported" || state === "denied" || state === "error" ? (
          <div className="rounded-lg border border-charcoal-border bg-charcoal p-6">
            <h2 className="font-serif text-xl text-offwhite">
              {state === "denied"
                ? "Izin kamera dibutuhkan"
                : "Pemindai belum bisa dipakai di sini"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-offwhite-muted">
              {state === "denied"
                ? "Aktifkan izin kamera untuk browser ini di pengaturan HP, lalu coba lagi."
                : "Buka kamera bawaan HP kamu dan arahkan ke QR di meja—kami akan membuka halaman pesanan secara otomatis."}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 min-h-11 rounded-md border border-charcoal-border px-5 text-sm text-offwhite transition hover:border-offwhite"
            >
              Mengerti
            </button>
          </div>
        ) : (
          <>
            <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-lg border border-charcoal-border bg-charcoal">
              <video
                ref={videoRef}
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-6 rounded-md border-2 border-offwhite/70"
                aria-hidden="true"
              />
            </div>
            <p className="mt-5 text-sm text-offwhite-muted">
              Arahkan kamera ke QR yang ada di mejamu.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
