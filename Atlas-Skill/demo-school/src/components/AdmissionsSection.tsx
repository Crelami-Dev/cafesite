"use client";

import { useState, useRef } from "react";
import { animate } from "animejs";
import { ADMISSION_WAVES, SCHOOL_FAQS } from "@/data/school";
import { prefersReducedMotion } from "@/lib/motion";

export function AdmissionsSection() {
  const [waveId, setWaveId] = useState(ADMISSION_WAVES[0].id);
  const [displaySeats, setDisplaySeats] = useState(ADMISSION_WAVES[0].seatsLeft);
  const seatTweenRef = useRef<{ cancel: () => void } | null>(null);

  const activeWave = ADMISSION_WAVES.find((w) => w.id === waveId) ?? ADMISSION_WAVES[0];

  const handleWaveChange = (nextId: string) => {
    const targetWave = ADMISSION_WAVES.find((w) => w.id === nextId);
    if (!targetWave || nextId === waveId) return;
    setWaveId(nextId);

    if (prefersReducedMotion()) {
      setDisplaySeats(targetWave.seatsLeft);
      return;
    }

    seatTweenRef.current?.cancel();
    const state = { val: displaySeats };
    seatTweenRef.current = animate(state, {
      val: targetWave.seatsLeft,
      duration: 320,
      ease: "outCubic",
      onUpdate: () => setDisplaySeats(Math.round(state.val)),
    });
  };

  return (
    <section
      id="ppdb"
      aria-labelledby="ppdb-heading"
      className="border-b border-forest/15 bg-chalk-soft py-14 md:py-20"
    >
      <div className="mx-auto max-w-[1180px] px-4 md:px-10">
        <div data-reveal className="max-w-[58ch]">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ochre">
            03 / PPDB &amp; Rincian Biaya Terbuka
          </p>
          <h2
            id="ppdb-heading"
            className="mt-2 font-serif text-[clamp(1.6rem,3vw,2.35rem)] leading-tight font-semibold text-forest"
          >
            Semua angka biaya dan sisa kursi ditampilkan terbuka sebelum Anda mengisi formulir.
          </h2>
        </div>

        <div data-reveal className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="rounded-[6px] border border-forest/20 bg-chalk-card p-6 lg:col-span-7">
            <div
              role="tablist"
              aria-label="Pilih gelombang pendaftaran PPDB"
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              {ADMISSION_WAVES.map((wave) => {
                const selected = wave.id === waveId;
                return (
                  <button
                    key={wave.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => handleWaveChange(wave.id)}
                    className={`min-h-11 rounded-[6px] border px-3.5 py-2.5 text-left text-sm font-semibold transition ${
                      selected
                        ? "border-ochre bg-forest text-chalk"
                        : "border-forest/20 bg-chalk text-forest hover:border-forest"
                    }`}
                  >
                    {wave.name}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 border-b border-forest/15 pb-5 sm:grid-cols-2">
              <div>
                <span className="text-xs font-medium text-forest-muted">Periode Pendaftaran</span>
                <p className="mt-1 text-sm font-bold text-forest">{activeWave.period}</p>
              </div>
              <div className="sm:text-right">
                <span className="text-xs font-medium text-forest-muted">Sisa Kuota Kursi</span>
                <p className="mt-1 font-serif text-2xl font-bold text-ochre">
                  {displaySeats}{" "}
                  <span className="font-sans text-xs font-normal text-forest-muted">
                    / {activeWave.totalSeats} kursi
                  </span>
                </p>
              </div>
            </div>

            <dl className="mt-5 space-y-3 border-b border-forest/15 pb-5 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-forest-muted">SPP Bulanan (Sudah termasuk Lab)</dt>
                <dd className="font-bold text-forest">{activeWave.monthlyTuition}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-forest-muted">Uang Pangkal Pengembangan</dt>
                <dd className="font-bold text-forest">{activeWave.entryFee}</dd>
              </div>
            </dl>

            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-[0.05em] text-forest-muted">
                Berkas Pendaftaran
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-forest">
                {activeWave.requirements.map((req) => (
                  <li key={req} className="flex items-start gap-2.5">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ochre" aria-hidden="true" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-forest-muted">{activeWave.note}</p>
            </div>
          </div>

          <div className="space-y-3 lg:col-span-5">
            <h3 className="font-serif text-xl font-semibold text-forest">
              Pertanyaan Orang Tua Calon Siswa
            </h3>
            {SCHOOL_FAQS.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-[6px] border border-forest/20 bg-chalk-card px-4 py-3"
              >
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-forest">
                  <span>{faq.question}</span>
                  <span className="shrink-0 text-base font-bold text-ochre">+</span>
                </summary>
                <p className="mt-2 border-t border-forest/10 pt-2.5 text-sm leading-relaxed text-forest-muted">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

