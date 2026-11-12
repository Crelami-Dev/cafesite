const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const IMAGE_EXT_REGEX = /\.(jpe?g|png|webp|avif|gif|bmp|tiff?|heic|heif|ico|svg)$/i;

/** Memeriksa apakah File berasal dari tipe/ekstensi gambar yang didukung. */
export function isSupportedImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (!file.type && IMAGE_EXT_REGEX.test(file.name)) return true;
  return IMAGE_EXT_REGEX.test(file.name);
}

/**
 * Mengonversi gambar menjadi WebP langsung di browser sebelum dikirim ke server bila format
 * didukung decoder browser (menghemat bandwidth upload dan menangani BMP/ICO secara mulus).
 * Untuk format khusus (seperti HEIC/TIFF), mengembalikan file asli agar sharp di server
 * yang mengonversinya menjadi WebP.
 */
export async function prepareImageWebpUpload(file: File, maxDimension: number): Promise<File> {
  if (!isSupportedImageFile(file)) {
    throw new Error("File harus berupa gambar (JPG, PNG, GIF, BMP, TIFF, AVIF, HEIC, atau WebP).");
  }
  if (file.size === 0) {
    throw new Error("File gambar kosong.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Ukuran gambar maksimal 20 MB sebelum dikonversi ke WebP.");
  }

  // Jika sudah WebP berukuran ringan (<= 450 KB), tetap kirim langsung ke server untuk validasi & resize ringan.
  if (file.type === "image/webp" && file.size <= 450 * 1024) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    try {
      const ratio = Math.min(1, maxDimension / Math.max(bitmap.width || 1, bitmap.height || 1));
      const width = Math.max(1, Math.round((bitmap.width || 1) * ratio));
      const height = Math.max(1, Math.round((bitmap.height || 1) * ratio));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;

      ctx.drawImage(bitmap, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((result) => resolve(result), "image/webp", 0.84),
      );
      if (!blob || blob.size === 0 || blob.type !== "image/webp") return file;

      const base = file.name.replace(/\.[^.]+$/, "") || "image";
      return new File([blob], `${base}.webp`, { type: "image/webp" });
    } finally {
      bitmap.close();
    }
  } catch {
    // Format belum didukung decoder browser (misal HEIC/TIFF di Chrome); biarkan sharp di server yang konversi.
    return file;
  }
}

