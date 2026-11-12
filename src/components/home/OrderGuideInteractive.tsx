"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import {
  ArrowRightIcon,
  ArtisanalBrewIcon,
  ChatIcon,
  CheckIcon,
  ClockIcon,
} from "@/components/ui/icons";
import { prefersReducedMotion } from "@/lib/motion";

interface OrderStep {
  id: number;
  number: string;
  shortLabel: string;
  title: string;
  description: string;
  ticketBadge: string;
  ticketIcon: "clock" | "brew" | "check";
  ticketState: string;
  totalLabel: string;
  isPaid: boolean;
  activeStepIndex: number;
}

const ORDER_STEPS: OrderStep[] = [
  {
    id: 0,
    number: "01",
    shortLabel: "Menunggu",
    title: "Scan QR & pilih menu di meja",
    description:
      "Atur takaran gula, es terpisah, atau catatan khusus—tanpa antre lama hanya untuk memesan.",
    ticketBadge: "Menunggu Bayar",
    ticketIcon: "clock",
    ticketState: "Tunjukkan nomor ini di kasir untuk bayar dan masuk antrean.",
    totalLabel: "Total · bayar di kasir",
    isPaid: false,
    activeStepIndex: 0,
  },
  {
    id: 1,
    number: "02",
    shortLabel: "Diproses",
    title: "Bayar di kasir, pesanan langsung diracik",
    description:
      "Setelah kasir konfirmasi pembayaranmu, tiket di layarmu otomatis pindah ke tahap diracik barista.",
    ticketBadge: "Sedang Diracik",
    ticketIcon: "brew",
    ticketState: "Pembayaran diterima — barista sedang menyiapkan pesananmu.",
    totalLabel: "Total · lunas di kasir",
    isPaid: true,
    activeStepIndex: 1,
  },
  {
    id: 2,
    number: "03",
    shortLabel: "Siap",
    title: "Tunggu bel & getar khas CafeSite",
    description:
      "Biarkan tab aktif saat menunggu. Begitu selesai, bel dan getar khas berbunyi agar tinggal diambil.",
    ticketBadge: "Siap Diambil",
    ticketIcon: "check",
    ticketState: "Bel berbunyi! Pesananmu siap diambil di meja kasir.",
    totalLabel: "Total · lunas di kasir",
    isPaid: true,
    activeStepIndex: 2,
  },
];

const TICKET_STEPS = ["Menunggu", "Diproses", "Siap", "Selesai"] as const;

function TicketBadgeIcon({ kind }: { kind: OrderStep["ticketIcon"] }) {
  if (kind === "clock") {
    return <ClockIcon className="size-3.5 text-offwhite-muted" />;
  }
  if (kind === "brew") {
    return <ArtisanalBrewIcon className="size-3.5 text-terracotta-light" />;
  }
  return <CheckIcon className="size-3.5 text-terracotta-light" />;
}

export function OrderGuideInteractive(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(1);
  const statusTextRef = useRef<HTMLParagraphElement | null>(null);
  const ticketRef = useRef<HTMLElement | null>(null);
  const stepBarsRef = useRef<Array<HTMLLIElement | null>>([]);
  const hasInteracted = useRef(false);
  const barAnimRef = useRef<ReturnType<typeof animate> | null>(null);

  const current = ORDER_STEPS[activeStep] ?? ORDER_STEPS[1];

  useEffect(() => {
    if (!hasInteracted.current) return;

    barAnimRef.current?.cancel();
    barAnimRef.current = null;

    if (prefersReducedMotion()) {
      stepBarsRef.current.forEach((el, idx) => {
        if (!el) return;
        el.style.setProperty("--fill", idx <= current.activeStepIndex ? "1" : "0");
      });
      return;
    }

    if (statusTextRef.current) {
      animate(statusTextRef.current, {
        opacity: [0, 1],
        y: [6, 0],
        duration: 340,
        ease: "outQuart",
      });
    }

    if (ticketRef.current) {
      animate(ticketRef.current, {
        opacity: [0.92, 1],
        duration: 280,
        ease: "outQuart",
      });
    }

    // Reset semua 4 bar ke 0 terlebih dulu, lalu isi bar aktif secara berurutan (1 penuh -> 2 penuh -> 3 penuh)
    const activeBars: HTMLLIElement[] = [];
    stepBarsRef.current.forEach((el, idx) => {
      if (!el) return;
      el.style.setProperty("--fill", "0");
      if (idx <= current.activeStepIndex) {
        activeBars.push(el);
      }
    });

    if (activeBars.length) {
      barAnimRef.current = animate(activeBars, {
        "--fill": [0, 1],
        duration: 380,
        delay: stagger(400),
        ease: "outCubic",
        onComplete: () => {
          activeBars.forEach((el) => el.style.setProperty("--fill", "1"));
        },
      });
    }
  }, [activeStep, current.activeStepIndex]);

  const handleSelectStep = (index: number): void => {
    hasInteracted.current = true;
    setActiveStep(index);
  };

  return (
    <div className="grid items-center gap-10 md:grid-cols-12 md:gap-8 lg:gap-12">
      {/* Kolom kiri: Judul editorial + 3 baris langkah interaktif + catatan WhatsApp ringkas */}
      <div className="md:col-span-7 lg:col-span-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta-light" data-reveal>
          Cara Memesan
        </p>
        <h2 id="order-guide-heading" className="public-h2 mt-2" data-reveal>
          Pesan dari meja, bayar di kasir
        </h2>

        {/* Mobile quick tab pill (ringkas agar tiket terlihat cepat di layar HP) */}
        <div
          className="mt-6 grid grid-cols-3 gap-2 md:hidden"
          role="tablist"
          aria-label="Tahap pemesanan"
        >
          {ORDER_STEPS.map((step, index) => {
            const isSelected = activeStep === index;
            return (
              <button
                key={step.number}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleSelectStep(index)}
                className={`min-h-11 rounded-md border px-2.5 py-2 text-left transition ${
                  isSelected
                    ? "border-terracotta bg-terracotta/15 text-offwhite"
                    : "border-offwhite/15 bg-charcoal-light/40 text-offwhite-muted hover:text-offwhite"
                }`}
              >
                <span className="block font-serif text-sm text-terracotta-light tabular-nums">
                  {step.number}
                </span>
                <span className="block truncate text-xs font-medium">
                  {step.shortLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Panel detail step aktif khusus Mobile */}
        <div className="mt-3 border-l-2 border-terracotta-light pl-4 py-1 md:hidden">
          <h3 className="text-base font-medium text-offwhite">{current.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-offwhite-muted">
            {current.description}
          </p>
        </div>

        {/* Desktop & Tablet: 3 baris ledger interaktif (ubah saat diklik, bukan saat hover) */}
        <ol
          className="mt-7 hidden divide-y divide-offwhite/12 border-y border-offwhite/12 md:block"
          data-reveal-group
        >
          {ORDER_STEPS.map((step, index) => {
            const isSelected = activeStep === index;
            return (
              <li key={step.number}>
                <button
                  type="button"
                  onClick={() => handleSelectStep(index)}
                  className="group flex w-full cursor-pointer items-start gap-5 py-4 text-left transition focus-visible:outline-2"
                >
                  <span
                    className={`font-serif text-2xl leading-none tabular-nums transition-colors ${
                      isSelected
                        ? "text-terracotta-light"
                        : "text-offwhite-muted/60 group-hover:text-offwhite"
                    }`}
                  >
                    {step.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3
                        className={`text-base font-medium transition-colors lg:text-lg ${
                          isSelected ? "text-offwhite" : "text-offwhite/85"
                        }`}
                      >
                        {step.title}
                      </h3>
                      <span
                        className={`h-1.5 w-1.5 rounded-full transition-opacity ${
                          isSelected
                            ? "bg-terracotta-light opacity-100"
                            : "bg-offwhite/30 opacity-0 group-hover:opacity-60"
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-offwhite-muted">
                      {step.description}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Baris aksi + info WhatsApp dalam satu ritme bersih tanpa box tempelan */}
        <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/order"
            className="btn btn--primary min-h-11 shrink-0 gap-2 text-sm"
          >
            <span>Buka halaman pesan</span>
            <ArrowRightIcon className="size-4" />
          </Link>

          <p className="flex items-center gap-2 text-xs leading-relaxed text-offwhite-muted">
            <ChatIcon className="size-4 shrink-0 text-terracotta-light" />
            <span>
              <strong className="font-medium text-offwhite">WhatsApp Order:</strong>{" "}
              Segera hadir — sementara pesan lewat situs atau langsung di kasir.
            </span>
          </p>
        </div>
      </div>

      {/* Kolom kanan: Figure tiket antrean yang menyesuaikan tiap tahap & beranimasi berurutan */}
      <div className="md:col-span-5 lg:col-span-6 lg:justify-self-end lg:w-full lg:max-w-[400px]">
        <figure
          ref={ticketRef}
          className="ticket mx-auto"
          data-reveal="ticket"
          role="img"
          aria-label={`Gambaran tiket nomor antrean di HP: nomor A-012, tahap ${current.shortLabel}, ${current.ticketState}`}
        >
          <div className="ticket__head">
            <span className="font-serif text-xl">CafeSite.</span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-wider ${
                current.isPaid ? "text-offwhite" : "text-offwhite-muted"
              }`}
            >
              <TicketBadgeIcon kind={current.ticketIcon} />
              <span>{current.ticketBadge}</span>
            </span>
          </div>
          <p className="ticket__queue">A-012</p>
          <p ref={statusTextRef} className="min-h-[44px] text-base text-offwhite-muted">
            {current.ticketState}
          </p>
          <ol className="ticket__steps" aria-hidden="true">
            {TICKET_STEPS.map((label, index) => (
              <li
                key={label}
                ref={(el) => {
                  stepBarsRef.current[index] = el;
                }}
                data-done={index <= current.activeStepIndex ? "true" : undefined}
              >
                {label}
              </li>
            ))}
          </ol>
          <div className="ticket__tear" aria-hidden="true" />
          <dl className="ticket__lines">
            <div>
              <dt>1 × Caramel Macchiato</dt>
              <dd>Rp 28.000</dd>
            </div>
            <div>
              <dt>1 × Butter Croissant</dt>
              <dd>Rp 24.000</dd>
            </div>
            <div className="ticket__total">
              <dt>{current.totalLabel}</dt>
              <dd className={current.isPaid ? "text-terracotta-light" : "text-offwhite"}>
                Rp 52.000
              </dd>
            </div>
          </dl>
        </figure>
      </div>
    </div>
  );
}
