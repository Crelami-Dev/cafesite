function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Kata tanya umum: kalimat berisi ini adalah pertanyaan, bukan perintah memesan. */
const QUESTION_WORD = /\b(?:berapa|apakah|kenapa|mengapa|gimana|bagaimana|siapa|kapan|dimana|di mana|banyak|apa saja|apa aja)\b/;
const QUESTION_START = /^(?:bisa|boleh|apakah|apa|ada|gimana|bagaimana|cara|kenapa|kapan|dimana|di mana|berapa|siapa|harga|jam|yang)\b/;
/** "bisa pesan lewat gofood?" / "cara pesan online" bertanya tentang kanal, bukan memesan sekarang. */
const CHANNEL_QUESTION = /\b(?:pesan|pesen|order|beli)\b.*\b(?:lewat|via|online|gofood|grabfood|grab|gojek|delivery|antar|reservasi|booking|telepon|wa)\b/;

/** Niat tegas memesan sekarang, termasuk dalam bentuk pertanyaan ("saya mau pesen bisa?", "boleh pesen?"). */
const STRONG_ORDER = /\b(?:mau|pengen|pingin|ingin|boleh|bisa|minta|pengin)\s+(?:pesan|pesen|order|beli)\b/;
const VERB_START = /^(?:pesan(?:an)?|pesen|order|beli|mau pesan|mau pesen|tambah(?:in|kan)?|nambah)\b/;

/**
 * Apakah pesan ini memulai pesanan? Ya bila: kalimat diawali pesan/order/beli, ada "mau/boleh/bisa + pesan"
 * (kecuali bertanya soal kanal seperti GoFood), atau pelanggan langsung menyebut jumlah/keinginan + nama menu
 * ("2 latte", "mau americano"). Pertanyaan umum ("yang pesen ada berapa banyak", "harga americano?") bukan niat memesan.
 */
export function isOrderIntent(text: string, menuNames: readonly string[] = []): boolean {
  const normalized = normalize(text);
  if (!normalized) return false;
  if (CHANNEL_QUESTION.test(normalized)) return false;
  if (STRONG_ORDER.test(normalized)) return true;
  const isQuestion = normalized.includes("?") || QUESTION_START.test(normalized) || QUESTION_WORD.test(normalized);
  if (isQuestion) return false;
  if (VERB_START.test(normalized)) return true;
  const names = menuNames.map((name) => name.toLowerCase());
  const mentionsMenu = names.some((name) => normalized.includes(name) || name.split(" ").some((word) => word.length >= 5 && normalized.includes(word)));
  if (!mentionsMenu) return false;
  return /^\d{1,2}\s*(?:x|buah|porsi|gelas)?\s*\S/.test(normalized) || /^(?:aku |saya |gue )?(?:mau|pengen|pingin|ingin|minta)\b/.test(normalized);
}

/** Kata pembuka niat memesan yang dibuang agar sisanya bisa dibaca sebagai daftar item ("pesan 2 latte" -> "2 latte"). */
export function stripOrderIntent(text: string): string {
  return text
    .replace(/^(?:\s*(?:halo|hai|hi|hei|permisi|kak|min|admin|tolong|dong|aku|saya|gue|gw)\b[\s,]*)+/gi, "")
    .replace(/^\s*(?:(?:mau|pengen|pingin|ingin|minta|boleh|bisa)\s+)*(?:(?:pesan(?:an)?|pesen|order|beli)\b\s*)+(?:\b(?:dong|ya|nih|yaa|deh|bisa|boleh)\b)?\s*/i, "")
    .replace(/^\s*(?:mau|pengen|pingin|ingin|minta)\s+/i, "")
    .replace(/[?.!]+$/g, "")
    .trim();
}

/** "gk"/"ga"/"nggak"/"enggak" -> "gak" supaya frasa pembatalan cukup ditulis sekali. */
function canonical(text: string): string {
  return normalize(text).replace(/[.!?]+$/g, "").replace(/\b(?:gk|ga|ngga|nggak|enggak|engga|tdk|tak)\b/g, "gak");
}

const CANCEL_EXACT = new Set(["batal", "cancel", "batalkan", "batalin", "batal pesan", "batalkan pesanan", "batalin pesanan", "batal pesanan", "batal deh", "batal aja", "gak jadi", "gak jadi deh", "gak jadi aja", "gak usah", "gak usah deh", "gak mau", "gak jadi pesan", "gak jadi beli", "gak jadi order", "gak jadi pesen", "tidak jadi", "tidak jadi pesan", "tidak jadi beli", "udahan", "sudahan", "udah gak jadi", "gak jadi dulu", "nanti aja", "nanti dulu", "gak jadi pesan deh", "gak jadi beli deh"]);

/** Membatalkan SELURUH pesanan (hanya frasa utuh, agar "batalin latte" atau "gak jadi latte" hanya menghapus latte). */
export function isCancelIntent(text: string): boolean {
  return CANCEL_EXACT.has(canonical(text));
}
