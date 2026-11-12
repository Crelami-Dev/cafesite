import Image from "next/image";
import { CAMPUS_SPACES } from "@/data/school";

export function CampusSpacesSection() {
  return (
    <section
      id="fasilitas"
      aria-labelledby="fasilitas-heading"
      className="border-b border-forest/15 bg-chalk py-14 md:py-20"
    >
      <div className="mx-auto max-w-[1180px] px-4 md:px-10">
        <div data-reveal className="max-w-[58ch]">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ochre">
            02 / Ruang Belajar &amp; Praktikum
          </p>
          <h2
            id="fasilitas-heading"
            className="mt-2 font-serif text-[clamp(1.6rem,3vw,2.35rem)] leading-tight font-semibold text-forest"
          >
            Fasilitas terawat yang dipakai setiap hari, bukan ruang pajangan brosur.
          </h2>
        </div>

        <div className="mt-10 grid gap-10">
          {CAMPUS_SPACES.map((space, index) => {
            const reverse = index % 2 === 1;
            return (
              <article
                key={space.id}
                data-reveal
                className="grid grid-cols-1 items-center gap-6 rounded-[6px] border border-forest/20 bg-chalk-card p-4 md:p-6 lg:grid-cols-12 lg:gap-8"
              >
                <div className={`lg:col-span-6 ${reverse ? "lg:order-2" : ""}`}>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[6px] border border-forest/15 bg-chalk-soft">
                    <Image
                      src={space.image}
                      alt={space.alt}
                      fill
                      loading="lazy"
                      sizes="(max-width: 1024px) 100vw, 520px"
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className={`lg:col-span-6 ${reverse ? "lg:order-1" : ""}`}>
                  <p className="text-xs font-bold uppercase tracking-[0.06em] text-ochre">
                    {space.code}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl font-semibold text-forest">
                    {space.title}
                  </h3>
                  <p className="mt-2 inline-block rounded-[6px] bg-chalk-soft px-2.5 py-1 text-xs font-semibold text-forest">
                    {space.capacityMetric}
                  </p>
                  <p className="mt-3 max-w-[52ch] text-base leading-relaxed text-forest-muted">
                    {space.description}
                  </p>
                  <ul className="mt-4 space-y-2 border-t border-forest/15 pt-4 text-sm text-forest">
                    {space.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2.5">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-forest" aria-hidden="true" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

