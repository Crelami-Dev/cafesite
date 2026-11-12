import { animate, stagger, svg } from "animejs";

import type { RevealKind } from "@/types";

/**
 * Lapisan animasi halaman publik (anime.js).
 * Prinsip: konten selalu utuh tanpa script. Elemen baru disembunyikan oleh script ini sendiri,
 * hanya bila masih di bawah layar, lalu muncul sekali saat di-scroll. Reduced motion: tidak ada yang bergerak.
 */

const EASE = "outQuart";
const RISE_PX = 18;
const BATCH_GAP_MS = 80;
const CHILD_GAP_MS = 70;
const MAX_STAGGER_STEPS = 8;
const INLINE_PROPS = ["transition", "will-change", "opacity", "transform", "clip-path", "--fill"] as const;
const TICKET_PARTS = ".ticket__steps li, .ticket__lines > div";

/** Apa pun yang bisa dibatalkan saat pindah halaman. */
interface Stoppable {
  cancel: () => unknown;
}
const WIPE_FROM = "inset(0% 0% 100% 0%)";
const WIPE_TO = "inset(0% 0% 0% 0%)";
const DOTS_FROM = "inset(-4px 100% -4px 0%)";
const DOTS_TO = "inset(-4px 0% -4px 0%)";

export function prefersReducedMotion(): boolean {
  return typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function release(el: HTMLElement): void {
  for (const prop of INLINE_PROPS) el.style.removeProperty(prop);
}

function parts(el: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(el.querySelectorAll<HTMLElement>(selector));
}

/** Keadaan awal sebelum elemen masuk layar. */
function hide(el: HTMLElement, kind: RevealKind): void {
  el.style.transition = "none";
  if (kind === "wipe") {
    el.style.clipPath = WIPE_FROM;
    return;
  }
  el.style.opacity = "0";
  for (const dots of parts(el, ".board-row__dots")) dots.style.clipPath = DOTS_FROM;
  if (kind === "ticket") {
    for (const step of parts(el, ".ticket__steps li[data-done]")) step.style.setProperty("--fill", "0");
    for (const line of parts(el, ".ticket__lines > div")) line.style.opacity = "0";
  }
}

/** Garis status tiket terisi satu per satu secara berurutan (1 penuh -> 2 penuh -> 3 penuh). */
function playTicketStatus(el: HTMLElement, delay: number): Stoppable[] {
  const steps = parts(el, ".ticket__steps li[data-done]");
  if (!steps.length) return [];
  for (const step of steps) step.style.setProperty("--fill", "0");
  return [
    animate(steps, {
      "--fill": [0, 1],
      duration: 420,
      delay: stagger(440, { start: delay }),
      ease: "outCubic",
      onComplete: () => steps.forEach(release),
    }),
  ];
}

/** Nomor antrean berhitung naik sampai nomor aslinya (teks asli selalu dikembalikan). */
function playTicketQueue(el: HTMLElement, delay: number): Stoppable[] {
  const queue = el.querySelector<HTMLElement>(".ticket__queue");
  const original = queue?.textContent ?? "";
  const match = /^(.*?)(\d+)$/.exec(original);
  if (!queue || !match) return [];
  const [, prefix, digits] = match;
  const counter = { value: 1 };
  const write = (value: number): void => {
    queue.textContent = prefix + String(Math.round(value)).padStart(digits.length, "0");
  };
  write(1);
  const animation = animate(counter, {
    value: Number(digits),
    duration: 900,
    delay,
    ease: EASE,
    onUpdate: () => write(counter.value),
    onComplete: () => {
      queue.textContent = original;
    },
  });
  return [
    {
      cancel: () => {
        animation.cancel();
        queue.textContent = original;
      },
    },
  ];
}

/** Memainkan satu elemen. Semua style inline dilepas lagi setelah selesai agar hover CSS tetap bekerja. */
function play(el: HTMLElement, kind: RevealKind, delay: number): Stoppable[] {
  el.style.willChange = "transform, opacity";

  if (kind === "wipe") {
    // Foto terbuka dari atas ke bawah sementara gambarnya mengendap ke ukuran asli.
    const img = el.querySelector<HTMLElement>("img");
    const out: Stoppable[] = [
      animate(el, { clipPath: [WIPE_FROM, WIPE_TO], duration: 1000, delay, ease: "inOutQuart", onComplete: () => release(el) }),
    ];
    if (img) {
      img.style.transition = "none";
      out.push(animate(img, { scale: [1.1, 1], duration: 1400, delay, ease: EASE, onComplete: () => release(img) }));
    }
    return out;
  }

  if (kind === "ticket") {
    // Tiket antrean "tercetak": naik sambil meluruskan diri, nomornya berhitung, rincian muncul baris demi baris,
    // lalu garis status terisi berurutan.
    const lines = parts(el, ".ticket__lines > div");
    return [
      animate(el, {
        opacity: [0, 1],
        y: [40, 0],
        rotate: [-6, -1.5],
        duration: 900,
        delay,
        ease: EASE,
        onComplete: () => release(el),
      }),
      animate(lines, {
        opacity: [0, 1],
        y: [8, 0],
        duration: 520,
        delay: stagger(130, { start: delay + 520 }),
        ease: EASE,
        onComplete: () => lines.forEach(release),
      }),
      ...playTicketQueue(el, delay + 200),
      ...playTicketStatus(el, delay + 750),
    ];
  }

  const out: Stoppable[] = [
    animate(el, { opacity: [0, 1], y: [RISE_PX, 0], duration: 720, delay, ease: EASE, onComplete: () => release(el) }),
  ];
  // Ikon garis (mis. fasilitas) menggambar dirinya sendiri saat barisnya muncul.
  if (el.matches("[data-draw]")) {
    const strokes = parts(el, 'svg :is(path, line, polyline, rect, circle):not([fill="currentColor"])');
    if (strokes.length) {
      out.push(animate(svg.createDrawable(strokes), { draw: ["0 0", "0 1"], duration: 1100, delay, ease: "inOutQuart" }));
    }
  }
  // Papan menu: garis titik-titik ditarik dari nama ke harga.
  const dots = parts(el, ".board-row__dots");
  if (dots.length) {
    out.push(
      animate(dots, { clipPath: [DOTS_FROM, DOTS_TO], duration: 700, delay: delay + 220, ease: EASE, onComplete: () => dots.forEach(release) }),
    );
  }
  return out;
}

function kindOf(el: HTMLElement): RevealKind {
  const value = el.dataset.reveal;
  return value === "wipe" || value === "ticket" ? value : "rise";
}

/**
 * Memunculkan elemen sekaligus (untuk perubahan akibat klik: hasil rekomendasi, ganti kategori galeri).
 * Mengembalikan fungsi pembatal.
 */
export function revealNow(targets: HTMLElement[], gap: number = CHILD_GAP_MS): () => void {
  if (prefersReducedMotion() || targets.length === 0) return () => {};
  const running = targets.flatMap((el, index) => {
    hide(el, kindOf(el));
    return play(el, kindOf(el), Math.min(index, MAX_STAGGER_STEPS) * gap);
  });
  return () => {
    running.forEach((animation) => animation.cancel());
    targets.forEach((el) => {
      release(el);
      parts(el, "img").forEach(release);
    });
  };
}

/**
 * Scroll reveal untuk [data-reveal] (satu elemen) dan [data-reveal-group] (anak langsungnya, berurutan).
 * Elemen yang sudah terlihat saat halaman dibuka dibiarkan apa adanya supaya tidak berkedip.
 */
export function initScrollReveal(root: ParentNode): () => void {
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) return () => {};

  const touched: HTMLElement[] = [];
  const running: Stoppable[] = [];
  const queue = new Map<Element, { kind: RevealKind; targets: HTMLElement[] }>();
  const foldLine = window.innerHeight * 0.92;

  for (const el of Array.from(root.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-group]"))) {
    if (el.getBoundingClientRect().top < foldLine) continue;
    const isGroup = el.hasAttribute("data-reveal-group");
    const kind: RevealKind = isGroup ? "rise" : kindOf(el);
    const targets = isGroup ? Array.from(el.children).filter((child): child is HTMLElement => child instanceof HTMLElement) : [el];
    for (const target of targets) {
      hide(target, kind);
      touched.push(target, ...parts(target, `.board-row__dots, ${TICKET_PARTS}, img`));
    }
    queue.set(el, { kind, targets });
  }

  let replayedAt = 0;
  const observer = new IntersectionObserver(
    (entries) => {
      let batch = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const item = queue.get(entry.target);
        if (!item) continue;
        observer.unobserve(entry.target);
        queue.delete(entry.target);
        if (item.kind === "ticket") replayedAt = performance.now() + 1500;
        const base = Math.min(batch, MAX_STAGGER_STEPS) * BATCH_GAP_MS;
        item.targets.forEach((target, index) => {
          running.push(...play(target, item.kind, base + Math.min(index, MAX_STAGGER_STEPS) * CHILD_GAP_MS));
        });
        batch += 1;
      }
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  queue.forEach((_, el) => observer.observe(el));

  // Kursor menyentuh tiket: garis status diputar ulang (hanya pointer halus, tidak saat animasi masuk berjalan).
  const tickets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal="ticket"]'));
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const replay = (event: Event): void => {
    const ticket = event.currentTarget as HTMLElement;
    if (queue.has(ticket) || ticket.style.opacity || performance.now() - replayedAt < 1600) return;
    replayedAt = performance.now();
    touched.push(...parts(ticket, TICKET_PARTS));
    running.push(...playTicketStatus(ticket, 0));
  };
  if (canHover) tickets.forEach((ticket) => ticket.addEventListener("pointerenter", replay));

  return () => {
    tickets.forEach((ticket) => ticket.removeEventListener("pointerenter", replay));
    observer.disconnect();
    running.forEach((animation) => animation.cancel());
    touched.forEach(release);
  };
}
