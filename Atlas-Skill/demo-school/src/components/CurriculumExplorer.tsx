"use client";

import { useState, useRef } from "react";
import { animate } from "animejs";
import { CURRICULUM_TRACKS } from "@/data/school";
import { prefersReducedMotion, releaseProps } from "@/lib/motion";

export function CurriculumExplorer() {
  const [activeId, setActiveId] = useState(CURRICULUM_TRACKS[0].id);
  const panelRef = useRef<HTMLElement>(null);

  const activeTrack =
    CURRICULUM_TRACKS.find((track) => track.id === activeId) ?? CURRICULUM_TRACKS[0];

  const handleSelect = (id: string) => {
    if (id === activeId) return;
    setActiveId(id);
    if (!prefersReducedMotion() && panelRef.current) {
      animate(panelRef.current, {
        opacity: [0.4, 1],
        y: [8, 0],
        duration: 240,
        ease: "outCubic",
        onComplete: () => {
          if (panelRef.current) releaseProps(panelRef.current);
        },
      });
    }
  };

  return (
    <section
      id="kurikulum"
      aria-labelledby="kurikulum-heading"
      className="border-b border-forest/15 bg-chalk-soft py-14 md:py-20"
    >
      <div className="mx-auto max-w-[1180px] px-4 md:px-10">
        <div data-reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[58ch]">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ochre">
              01 / Tiga Jalur Peminatan
            </p>
            <h2
              id="kurikulum-heading"
              className="mt-2 font-serif text-[clamp(1.6rem,3vw,2.35rem)] leading-tight font-semibold text-forest"
            >
              Siswa memilih fokus praktik sejak kelas X, dengan proyek riset nyata di kelas XII.
            </h2>
          </div>

          <svg
            width="168"
            height="36"
            viewBox="0 0 168 36"
            fill="none"
            className="hidden shrink-0 md:block"
            aria-hidden="true"
          >
            <path
              className="draw-path"
              d="M8 18 H62 L76 8 L92 28 L108 18 H160"
              stroke="#9A5B0A"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="8" cy="18" r="3.5" fill="#153226" />
            <circle cx="160" cy="18" r="3.5" fill="#9A5B0A" />
          </svg>
        </div>

        <div data-reveal className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div
            role="tablist"
            aria-label="Pilih jalur peminatan sekolah"
            className="flex flex-col gap-3 lg:col-span-5"
          >
            {CURRICULUM_TRACKS.map((track) => {
              const selected = track.id === activeId;
              return (
                <button
                  key={track.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => handleSelect(track.id)}
                  className={`grid min-h-[64px] w-full grid-cols-[34px_1fr] items-start gap-3 rounded-[6px] border px-4 py-4 text-left transition ${
                    selected
                      ? "border-ochre bg-chalk-card shadow-[inset_4px_0_0_#9A5B0A]"
                      : "border-forest/20 bg-chalk hover:border-forest/40"
                  }`}
                >
                  <span className="pt-0.5 text-xs font-bold text-ochre">{track.code}</span>
                  <span>
                    <span className="block text-base font-bold text-forest">{track.title}</span>
                    <span className="mt-1 block text-sm text-forest-muted">{track.subtitle}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <article
            ref={panelRef}
            aria-live="polite"
            className="rounded-[6px] border border-forest/20 bg-chalk-card p-6 md:p-8 lg:col-span-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-forest/15 pb-4">
              <h3 className="font-serif text-xl font-semibold text-forest md:text-2xl">
                {activeTrack.title}
              </h3>
              <span className="rounded-[6px] border border-ochre/35 bg-[#FDF6EB] px-3 py-1 text-xs font-semibold text-ochre">
                {activeTrack.practiceHours}
              </span>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-[0.05em] text-forest-muted">
                  Mata Pelajaran Inti
                </h4>
                <ul className="mt-3 space-y-2.5 text-sm text-forest">
                  {activeTrack.subjects.map((sub) => (
                    <li key={sub} className="flex items-start gap-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ochre" aria-hidden="true" />
                      <span>{sub}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[6px] border border-forest/15 bg-chalk-soft p-4">
                <h4 className="text-xs font-bold uppercase tracking-[0.05em] text-ochre">
                  Proyek Akhir Kelas XII
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-forest">{activeTrack.capstone}</p>
                <p className="mt-3 border-t border-forest/15 pt-3 text-xs leading-relaxed text-forest-muted">
                  {activeTrack.outcome}
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

