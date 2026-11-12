"use client";

import { useState } from "react";

export function VisitBookingFooter() {
  const [parentName, setParentName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [visitDay, setVisitDay] = useState("Sabtu Pagi (09.00 WIB)");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = parentName.trim();
    const cleanWa = whatsapp.trim();
    if (cleanName.length < 2 || cleanWa.length < 9) {
      setFeedback("Mohon isi nama orang tua/wali dan nomor WhatsApp aktif.");
      return;
    }
    setFeedback(
      `Tercatat untuk ${cleanName} pada jadwal ${visitDay}. Panitia PPDB menghubungi ke ${cleanWa} maksimal 1x24 jam.`
    );
  };

  return (
    <footer id="kunjungan" className="bg-forest py-14 text-chalk md:py-20">
      <div className="mx-auto max-w-[1180px] px-4 md:px-10">
        <div className="grid grid-cols-1 gap-10 border-b border-chalk/20 pb-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#F2BA63]">
              04 / Jadwalkan Kunjungan Sekolah
            </p>
            <h2 className="mt-2 font-serif text-[clamp(1.65rem,3vw,2.45rem)] leading-tight font-semibold text-chalk">
              Lihat ruang kelas dan bicara langsung dengan guru wali sebelum memutuskan.
            </h2>
            <p className="mt-4 max-w-[50ch] text-base leading-relaxed text-chalk/80">
              Kami mengundang orang tua dan calon siswa berkeliling laboratorium, perpustakaan, serta berdiskusi singkat dengan tim kurikulum tanpa paksaan mendaftar di tempat.
            </p>
            <dl className="mt-6 space-y-2 text-sm text-chalk/85">
              <div>
                <dt className="inline font-semibold text-chalk">Alamat: </dt>
                <dd className="inline">Jl. Bukit Pakar Timur No. 48, Cimenyan, Kab. Bandung</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-chalk">Jam Layanan: </dt>
                <dd className="inline">Senin–Sabtu, 07.30 – 15.30 WIB</dd>
              </div>
            </dl>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="grid gap-4 rounded-[6px] border border-chalk/20 bg-white/5 p-6 lg:col-span-6"
          >
            <div>
              <label htmlFor="parent-name" className="mb-1.5 block text-sm font-medium text-chalk">
                Nama Orang Tua / Wali
              </label>
              <input
                id="parent-name"
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Budi Santoso"
                className="min-h-11 w-full rounded-[6px] border border-chalk/30 bg-forest px-3.5 py-2.5 text-sm text-chalk placeholder:text-chalk/55 focus:border-ochre focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="wa-number" className="mb-1.5 block text-sm font-medium text-chalk">
                  Nomor WhatsApp Aktif
                </label>
                <input
                  id="wa-number"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="0812-3456-7890"
                  className="min-h-11 w-full rounded-[6px] border border-chalk/30 bg-forest px-3.5 py-2.5 text-sm text-chalk placeholder:text-chalk/55 focus:border-ochre focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="visit-slot" className="mb-1.5 block text-sm font-medium text-chalk">
                  Pilihan Waktu Survei
                </label>
                <select
                  id="visit-slot"
                  value={visitDay}
                  onChange={(e) => setVisitDay(e.target.value)}
                  className="min-h-11 w-full rounded-[6px] border border-chalk/30 bg-forest px-3.5 py-2.5 text-sm text-chalk focus:border-ochre focus:outline-none"
                >
                  <option value="Sabtu Pagi (09.00 WIB)">Sabtu Pagi (09.00 WIB)</option>
                  <option value="Rabu Siang (13.30 WIB)">Rabu Siang (13.30 WIB)</option>
                  <option value="Jumat Pagi (09.30 WIB)">Jumat Pagi (09.30 WIB)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="min-h-11 rounded-[6px] bg-ochre px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ochre-hover"
            >
              Konfirmasi Jadwal Kunjungan
            </button>

            {feedback ? (
              <p role="status" className="text-xs font-medium text-[#F5C576]">
                {feedback}
              </p>
            ) : null}
          </form>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 text-xs text-chalk/75">
          <span>© 2026 SMA Aksara Nusantara Bandung • NPSN 20299481</span>
          <div className="flex flex-wrap gap-2">
            <a href="#top" className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-chalk hover:underline">
              Ke Atas
            </a>
            <a href="#kurikulum" className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-chalk hover:underline">
              Peminatan
            </a>
            <a href="#fasilitas" className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-chalk hover:underline">
              Fasilitas
            </a>
            <a href="#ppdb" className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-chalk hover:underline">
              PPDB
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

