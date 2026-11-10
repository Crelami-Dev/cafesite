/**
 * Pengolah teks Indonesia ringan untuk pencarian: normalisasi, stopword, stemmer sederhana,
 * dan ekspansi sinonim/bahasa gaul domain kafe. Murni heuristik (tanpa model), cepat, dan deterministik.
 */

const STOPWORDS = new Set([
  "yang", "dan", "di", "ke", "dari", "untuk", "dengan", "ada", "adakah", "apa", "apakah", "berapa", "bagaimana", "gimana", "kak", "min", "admin",
  "mau", "bisa", "boleh", "saya", "aku", "kamu", "anda", "itu", "ini", "atau", "ya", "lagi", "sih", "dong", "deh", "kok", "nih", "tuh", "aja", "saja",
  "gak", "nggak", "ngga", "tidak", "bukan", "gitu", "kalau", "kalo", "klo", "jika", "kan", "pada", "dalam", "akan", "sudah", "udah", "belum", "juga",
  "the", "is", "a", "of", "to", "kah", "lah", "ga", "pun", "bisakah", "bolehkah", "dimana", "mana", "kapan", "siapa", "kenapa", "mengapa", "temen",
  "teman", "buat", "bikin", "sama", "nya", "ke", "pake", "pakai", "gimana",
]);

/** Slang/ejaan umum → bentuk baku sebelum stemming. */
const NORMALIZE: Record<string, string> = {
  rame: "ramai", ramé: "ramai", brp: "berapa", jm: "jam", jam2: "jam", yg: "yang", dgn: "dengan", utk: "untuk", tp: "tapi", bs: "bisa",
  dmn: "dimana", krn: "karena", sampe: "sampai", sampai: "sampai", resv: "reservasi", reserv: "reservasi", booking: "reservasi", book: "reservasi",
  muslim: "muslim", sholat: "salat", shalat: "salat", solat: "salat", mushola: "musala", musholla: "musala", mushalla: "musala", surau: "musala",
  "ultah": "ulangtahun", lowbat: "lowbat",
};

/**
 * Kelompok sinonim: kata apa pun di grup memicu pencarian semua istilah kanonik grup tsb.
 * Kata kanonik ditulis seperti muncul di dokumen umum (sebelum stemming).
 */
const SYNONYM_GROUPS: { words: string[]; add: string[] }[] = [
  { words: ["anabul", "hewan", "peliharaan", "kucing", "anjing", "kucingnya", "pet", "binatang"], add: ["hewan", "peliharaan"] },
  { words: ["gopay", "ovo", "dana", "shopeepay", "linkaja", "qris", "qr", "scan", "ewallet", "emoney", "dompet", "digital"], add: ["qris", "pembayaran"] },
  { words: ["bayar", "pembayaran", "transfer", "tunai", "cash", "debit", "kredit", "kartu", "cod", "kasir"], add: ["pembayaran", "kasir"] },
  { words: ["hp", "lowbat", "charger", "cas", "casan", "listrik", "stopkontak", "nugas", "kerja", "wfh", "laptop", "colokan", "tugas"], add: ["colokan", "listrik", "kerja"] },
  { words: ["wc", "toilet", "kamar", "mandi", "restroom", "kloset"], add: ["toilet"] },
  { words: ["delivery", "antar", "ojol", "gojek", "grab", "gofood", "grabfood", "kirim", "ongkir"], add: ["antar", "gofood", "grabfood"] },
  { words: ["sepi", "tenang", "ramai", "antri", "antre", "penuh", "padat", "crowded"], add: ["ramai", "tenang"] },
  { words: ["vegetarian", "vegan", "nabati", "sayur", "sayuran", "plant", "daging", "meat"], add: ["vegan"] },
  { words: ["balita", "bayi", "anak", "kecil", "kids", "baby", "bocah", "fasilitas"], add: ["anak", "bayi", "kursi"] },
  { words: ["ultahnya", "ulangtahun", "birthday", "arisan", "event", "pesta", "acara", "rapat", "meeting", "farewell", "kue"], add: ["acara", "private"] },
  { words: ["rombongan", "grup", "group", "bareng", "banyak", "reservasi", "orang"], add: ["reservasi", "rombongan"] },
  { words: ["potongan", "diskon", "mahasiswa", "pelajar", "student", "promo", "murah", "gratis", "voucher"], add: ["diskon", "promo", "pelajar"] },
  { words: ["buka", "tutup", "jam", "operasional", "open", "close", "libur", "jadwal"], add: ["jam", "buka", "operasional"] },
  { words: ["rokok", "merokok", "vape", "smoking"], add: ["merokok", "rokok"] },
  { words: ["bubuk", "biji", "bean", "beans", "giling", "oleh2", "oleh"], add: ["biji", "kopi", "kemasan"] },
  { words: ["salat", "ibadah", "musala", "wudhu", "wudu", "mukena"], add: ["musala", "mukena"] },
  { words: ["password", "pass", "sandi", "wifi", "internet", "wi-fi", "koneksi"], add: ["wifi", "sandi"] },
  { words: ["parkir", "parkiran", "motor", "mobil", "valet"], add: ["parkir", "motor", "mobil"] },
  { words: ["alamat", "lokasi", "letak", "maps", "petunjuk", "arah"], add: ["alamat", "lokasi"] },
  { words: ["susu", "alergi", "alergen", "laktosa", "oat", "almond", "kacang"], add: ["alergi", "susu", "oat"] },
  { words: ["muat", "kapasitas", "kursi", "tempat", "duduk"], add: ["kapasitas", "kursi"] },
];

const SYNONYM_INDEX = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) for (const word of group.words) SYNONYM_INDEX.set(word, [...(SYNONYM_INDEX.get(word) ?? []), ...group.add]);

const PREFIXES = ["meng", "meny", "mem", "men", "me", "ber", "per", "pen", "pem", "di", "ter", "ke", "se", "pe"];
const SUFFIXES = ["kanlah", "kan", "lah", "nya", "an", "i"];

/** Stemmer Indonesia sederhana: buang partikel/akhiran, lalu awalan, selama sisa ≥ 4 huruf. */
export function stem(word: string): string {
  let w = word;
  if (w.length <= 4) return w;
  // Akhiran dibuang sampai dua lapis ("pembayarannya" -> "pembayaran" -> "pembayar"), awalan satu kali.
  for (let pass = 0; pass < 2; pass += 1) {
    const suffix = SUFFIXES.find((candidate) => w.endsWith(candidate) && w.length - candidate.length >= 4);
    if (!suffix) break;
    w = w.slice(0, -suffix.length);
  }
  for (const prefix of PREFIXES) if (w.startsWith(prefix) && w.length - prefix.length >= 4) { w = w.slice(prefix.length); break; }
  return w;
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/(\d)[.,](\d)/g, "$1$2") // 08.00 → 0800, 85.000 → 85000
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Token dokumen: normalisasi + buang stopword + stem. */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const raw of words(text)) {
    const word = NORMALIZE[raw] ?? raw;
    if ((word.length < 2 && !/\d/.test(word)) || STOPWORDS.has(word)) continue;
    out.push(stem(word));
  }
  return out;
}

export interface QueryTerm { term: string; weight: number; /** Kata asli di pertanyaan (indeks) yang memunculkan istilah ini, langsung atau lewat sinonim. */ concepts: number[] }

/**
 * Token query: kata asli (bobot 1) + sinonim domain (bobot 0.6), semuanya di-stem dan dideduplikasi.
 * Tiap istilah mencatat "konsep"-nya (kata asli pemicu) agar pencarian bisa mengukur seberapa banyak
 * maksud pertanyaan yang tercakup sebuah potongan, bukan sekadar satu kata umum yang kebetulan sama.
 */
export function queryTerms(text: string): QueryTerm[] {
  const found = new Map<string, QueryTerm>();
  const put = (term: string, weight: number, concept: number): void => {
    const existing = found.get(term);
    if (existing) { existing.weight = Math.max(existing.weight, weight); if (!existing.concepts.includes(concept)) existing.concepts.push(concept); }
    else found.set(term, { term, weight, concepts: [concept] });
  };
  let concept = -1;
  for (const raw of words(text)) {
    const word = NORMALIZE[raw] ?? raw;
    if (STOPWORDS.has(word) || (word.length < 2 && !/d/.test(word))) continue;
    concept += 1;
    put(stem(word), 1, concept);
    for (const synonym of SYNONYM_INDEX.get(word) ?? SYNONYM_INDEX.get(raw) ?? SYNONYM_INDEX.get(stem(word)) ?? []) put(stem(synonym), 0.6, concept);
  }
  return [...found.values()];
}
