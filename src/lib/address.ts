/**
 * Alamat untuk tampilan publik. Nomor rumah tidak ditonjolkan di judul besar; alamat lengkap
 * tetap ada di blok kunjungan dan tautan peta.
 */

/** "Jl. Senopati Raya No. 12, Kebayoran Baru" -> "Kebayoran Baru" (tanpa koma: alamat utuh). */
export function district(address: string): string {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.at(-1) ?? address.trim();
}
