import type { AdmissionWave, CampusSpace, FaqItem, PeminatanTrack } from "@/types";

export const SCHOOL_FACTS = [
  { label: "Akreditasi BAN-S/M", value: "A (Skor 96)" },
  { label: "Rasio Kelas", value: "1 Guru : 14 Siswa" },
  { label: "Lokasi Kampus", value: "Dago Atas, Bandung" },
] as const;

export const CURRICULUM_TRACKS: PeminatanTrack[] = [
  {
    id: "mipa",
    code: "01",
    title: "MIPA & Riset Terapan",
    subtitle: "Fokus sains eksperimental, statistika, & mikrokontroler",
    practiceHours: "8 jam praktik laboratorium / minggu",
    capstone: "Riset kualitas air sungai Cikapundung atau sensor cuaca IoT sederhana pada Semester 5.",
    subjects: [
      "Fisika Eksperimental & Elektronika Dasar",
      "Biokimia Terapan & Analisis Sampel",
      "Kalkulus Pemodelan & Statistika Data",
      "Metodologi Riset Ilmiah Remaja",
    ],
    outcome: "Lulusan membawa portofolio laporan eksperimen teruji & kesiapan jurusan teknik/kedokteran.",
  },
  {
    id: "sosial",
    code: "02",
    title: "Ilmu Sosial & Kebijakan",
    subtitle: "Fokus ekonomi mikro, sosiologi kota, & debat publik",
    practiceHours: "6 jam riset lapangan / minggu",
    capstone: "Studi kasus UMKM sekitar Bandung Utara & presentasi naskah kebijakan di hadapan juri tamu.",
    subjects: [
      "Ekonomi Terapan & Literasi Keuangan",
      "Sosiologi Perkotaan & Pemetaan Sosial",
      "Penulisan Esai Argumentatif & Retorika",
      "Sejarah Kontemporer & Studi Kawasan",
    ],
    outcome: "Melatih siswa menalar data sosial dengan argumen terstruktur untuk hukum, ekonomi, dan hubungan internasional.",
  },
  {
    id: "bahasa",
    code: "03",
    title: "Bahasa & Desain Media",
    subtitle: "Fokus jurnalisme dokumenter, sastra, & desain editorial",
    practiceHours: "7 jam studio produksi / minggu",
    capstone: "Penerbitan antologi esai cetak atau film dokumenter pendek berdurasi 12 menit.",
    subjects: [
      "Penulisan Kreatif & Jurnalisme Warga",
      "Bahasa Inggris Akademik (Persiapan IELTS)",
      "Tipografi, Tata Letak Cetak, & Fotografi",
      "Bahasa Asing Pilihan (Jepang / Jerman)",
    ],
    outcome: "Siswa terbiasa menulis jernih, menyunting media visual, dan siap melanjutkan ke DKV maupun ilmu komunikasi.",
  },
];

export const CAMPUS_SPACES: CampusSpace[] = [
  {
    id: "lab",
    code: "FASILITAS 01",
    title: "Laboratorium Sains & Robotika Terpadu",
    image: "/images/lab-science.webp",
    alt: "Tiga siswa SMA Aksara Nusantara sedang mengamati mikroskop dan merangkai papan sirkuit di meja kayu laboratorium yang terang",
    capacityMetric: "24 Meja Kerja • Maks. 2 Siswa per Stasiun",
    description:
      "Dirancang agar setiap siswa benar-benar menyentuh alat ukur, osiloskop, dan reagen kimia—bukan sekadar menonton demonstrasi di papan tulis.",
    details: [
      "Mikroskop binokuler rasio 1:2 per kelompok praktikum",
      "Meja solder & stasiun Arduino untuk proyek fisika terapan",
      "Ventilasi silang menghadap taman konservasi kampus",
    ],
  },
  {
    id: "library",
    code: "FASILITAS 02",
    title: "Perpustakaan Kayu & Ruang Diskusi Tenang",
    image: "/images/library-study.webp",
    alt: "Ruang baca perpustakaan SMA Aksara Nusantara bermeja hijau tua dan rak kayu penuh buku dengan cahaya pagi alami",
    capacityMetric: "6.400 Judul Buku • Akses Jurnal Ilmiah Daring",
    description:
      "Ruang baca sunyi tanpa bel bising dengan meja kelompok kecil untuk bimbingan riset, membaca karya sastra, dan persiapan esai beasiswa.",
    details: [
      "Katalog buku cetak terindeks & arsip soal kompetisi sains",
      "Ruang konsultasi guru pembimbing 3 hari seminggu",
      "Jam buka hingga pukul 17.30 WIB bagi peserta klub riset",
    ],
  },
];

export const ADMISSION_WAVES: AdmissionWave[] = [
  {
    id: "prestasi",
    name: "Gelombang 1 — Jalur Prestasi & Minat",
    period: "15 November 2026 – 20 Januari 2027",
    seatsLeft: 28,
    totalSeats: 60,
    monthlyTuition: "Rp 1.450.000",
    entryFee: "Rp 9.500.000 (potongan 30% peringkat paralel 1–5)",
    requirements: [
      "Fotokopi rapor SMP semester 1–4 rata-rata minimal 82",
      "Portofolio karya tulis, piagam lomba, atau proyek sains/seni",
      "Wawancara singkat orang tua dan calon siswa bersama wali akademik",
    ],
    note: "Pengumuman hasil seleksi diumumkan 7 hari kerja setelah sesi wawancara.",
  },
  {
    id: "reguler",
    name: "Gelombang 2 — Jalur Tes Akademik Reguler",
    period: "1 Februari – 30 April 2027",
    seatsLeft: 46,
    totalSeats: 84,
    monthlyTuition: "Rp 1.450.000",
    entryFee: "Rp 11.500.000 (dapat dicicil 3x tanpa bunga)",
    requirements: [
      "Mengikuti asesmen literasi membaca, logika matematika, & minat belajar",
      "Menyerahkan rapor SMP semester 1–5 lengkap",
      "Surat keterangan sehat & bebas buta warna (khusus peminatan MIPA Kimia)",
    ],
    note: "Tidak ada biaya formulir pendaftaran ulang jika belum dinyatakan diterima.",
  },
];

export const SCHOOL_FAQS: FaqItem[] = [
  {
    question: "Apakah SPP bulanan sudah termasuk biaya praktikum dan buku modul?",
    answer:
      "Ya. SPP Rp 1.450.000/bulan sudah mencakup seluruh bahan habis pakai laboratorium reguler, akses perpustakaan, serta modul cetak semester. Kegiatan karya wisata luar kota di kelas XI dibayar terpisah atas persetujuan komite orang tua.",
  },
  {
    question: "Kapan siswa menentukan pilihan jalur peminatan?",
    answer:
      "Pada dua minggu pertama kelas X siswa mengikuti masa orientasi akademik dan uji coba lintas lab sebelum mengunci peminatan utama di semester 1, dan tetap boleh mengajukan penyesuaian hingga akhir semester 2.",
  },
  {
    question: "Bagaimana sistem antar-jemput dan keamanan gerbang sekolah?",
    answer:
      "Area drop-off berkanopi berada di halaman dalam kampus agar tidak memicu kemacetan di Jalan Dago Atas, dengan pencatatan kehadiran terhubung notifikasi WhatsApp resmi kepada orang tua setiap pagi.",
  },
];

