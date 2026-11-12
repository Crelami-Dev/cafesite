"use client";

import { animate, stagger, svg } from "animejs";

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function releaseProps(el: HTMLElement): void {
  el.style.removeProperty("opacity");
  el.style.removeProperty("transform");
  el.style.removeProperty("will-change");
  el.style.removeProperty("clip-path");
}

export function runStaggerReveal(elements: HTMLElement[], delayStep = 70): void {
  if (!elements.length || prefersReducedMotion()) {
    elements.forEach(releaseProps);
    return;
  }
  animate(elements, {
    opacity: [0, 1],
    y: [16, 0],
    duration: 540,
    delay: stagger(delayStep),
    ease: "outQuart",
    onComplete: () => elements.forEach(releaseProps),
  });
}

export function runHeroImageWipe(frameEl: HTMLElement): void {
  if (prefersReducedMotion()) {
    releaseProps(frameEl);
    return;
  }
  animate(frameEl, {
    opacity: [0, 1],
    y: [18, 0],
    duration: 640,
    delay: 140,
    ease: "outQuart",
    onComplete: () => releaseProps(frameEl),
  });
}

export function setupScrollReveal(container: HTMLElement): () => void {
  const targets = Array.from(container.querySelectorAll<HTMLElement>("[data-reveal]"));
  if (!targets.length || prefersReducedMotion() || !("IntersectionObserver" in window)) {
    targets.forEach((el) => {
      el.dataset.shown = "1";
      releaseProps(el);
    });
    return () => {};
  }

  const show = (el: HTMLElement) => {
    if (el.dataset.shown === "1") return;
    el.dataset.shown = "1";
    animate(el, {
      opacity: [0, 1],
      y: [18, 0],
      duration: 520,
      ease: "outQuart",
      onComplete: () => releaseProps(el),
    });
    const paths = el.querySelectorAll<SVGGeometryElement>(".draw-path");
    if (paths.length) {
      animate(svg.createDrawable(paths), {
        draw: ["0 0", "0 1"],
        duration: 850,
        ease: "inOutQuart",
      });
    }
  };

  const vh = window.innerHeight || 800;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          show(entry.target as HTMLElement);
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08 }
  );

  for (const el of targets) {
    if (el.getBoundingClientRect().top > vh * 0.92) {
      el.style.opacity = "0";
      io.observe(el);
    } else {
      el.dataset.shown = "1";
    }
  }

  let scrollTimer: ReturnType<typeof setTimeout> | undefined;
  const onScroll = () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const currentVh = window.innerHeight || 800;
      for (const el of targets) {
        if (el.dataset.shown !== "1" && el.getBoundingClientRect().top < currentVh * 1.08) {
          show(el);
          io.unobserve(el);
        }
      }
    }, 80);
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    io.disconnect();
    window.removeEventListener("scroll", onScroll);
    clearTimeout(scrollTimer);
  };
}

