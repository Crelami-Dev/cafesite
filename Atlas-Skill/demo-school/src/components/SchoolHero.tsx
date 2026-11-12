"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { SCHOOL_FACTS } from "@/data/school";
import { runHeroImageWipe, runStaggerReveal } from "@/lib/motion";

export function SchoolHero() {
  const rootRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-hero-item]") ?? []);
    runStaggerReveal(els, 70);
    if (frameRef.current) runHeroImageWipe(frameRef.current);
  }, []);

  return (
    <section
      id="top"
      ref={rootRef}
      aria-labelledby="school-hero-heading"
      className="border-b border-forest/15 bg-chalk py-10 md:py-16"
    >
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-8 px-4 md:px-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <p
            data-hero-item
            className="inline-flex items-center gap-2 rounded-[6px] border border-forest/20 bg-chalk-card px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-ochre"
          >
            <span className="size-2 rounded-full bg-ochre" aria-hidden="true" />
            PPDB 2027/2028 • Bandung Utara
          </p>

          <h1
            id="school-hero-heading"
            data-hero-item
            className="mt-4 font-serif text-[clamp(2rem,4.1vw,3.35rem)] leading-[1.1] font-semibold tracking-tight text-forest"
          >
            Belajar dari eksperimen nyata, bukan sekadar menghafal lembar soal.
          </h1>

          <p
            data-hero-item
            className="mt-4 max-w-[54ch] text-base leading-relaxed text-forest-muted md:text-lg"
          >
            SMA Aksara Nusantara mendampingi maksimal 24 siswa per kelas dengan rasio guru 1:14, riset laboratorium mingguan, dan laporan perkembangan belajar terbuka kepada orang tua.
          </p>

          <div data-hero-item data-cta-row className="mt-7 grid max-w-[380px] grid-cols-2 gap-3">
            <a
              href="#kunjungan"
              className="inline-flex min-h-11 items-center justify-center rounded-[6px] bg-ochre px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ochre-hover whitespace-nowrap"
            >
              Jadwalkan Survei
            </a>
            <a
              href="#kurikulum"
              className="inline-flex min-h-11 items-center justify-center rounded-[6px] border border-forest/30 bg-chalk-card px-4 py-2.5 text-sm font-semibold text-forest transition hover:border-forest hover:bg-chalk-soft whitespace-nowrap"
            >
              Lihat Peminatan
            </a>
          </div>

          <dl
            data-hero-item
            className="mt-8 grid grid-cols-3 gap-3 border-t border-forest/20 pt-5"
          >
            {SCHOOL_FACTS.map((fact) => (
              <div key={fact.label}>
                <dt className="text-xs font-medium text-forest-muted">{fact.label}</dt>
                <dd className="mt-0.5 text-sm font-bold text-forest sm:text-base">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div ref={frameRef} className="lg:col-span-6">
          <div className="overflow-hidden rounded-[6px] border border-forest/20 bg-chalk-card">
            <div className="relative aspect-[16/10] w-full bg-chalk-soft">
              <Image
                src="/images/hero-campus.webp"
                alt="Halaman teduh dan koridor belajar dua lantai SMA Aksara Nusantara Bandung dengan taman pepohonan hijau"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-forest/15 bg-forest px-4 py-3 text-xs text-chalk">
              <span className="font-semibold">Kunjungan Kampus Terbuka Setiap Sabtu</span>
              <span className="text-chalk/80">08.30 – 12.00 WIB • Jl. Bukit Pakar Timur</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

