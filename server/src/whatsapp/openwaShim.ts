import { execSync } from "node:child_process";
import Module from "node:module";

type Loader = (request: string, ...rest: unknown[]) => unknown;
let applied = false;

function zstdInstalled(): boolean {
  try {
    execSync(process.platform === "win32" ? "where zstd.exe" : "which zstd", { stdio: "ignore" });
    return true;
  } catch { return false; }
}

/**
 * @open-wa/wa-automate 5.x memuat `simple-zstd` saat di-import, dan paket itu melempar error kalau binary
 * `zstd` tidak ada di PATH ("Can not access zstd!") - padahal hanya dipakai fitur sinkron sesi ke S3 yang
 * tidak kita pakai. Bila zstd tidak terpasang, modul itu diganti stub yang baru melempar saat benar-benar
 * dipanggil, sehingga bot bisa jalan tanpa memasang zstd. Bila zstd terpasang, tidak ada yang diubah.
 */
export function allowOpenWaWithoutZstd(): void {
  if (applied || zstdInstalled()) return;
  applied = true;
  const internals = Module as unknown as { _load: Loader };
  const original = internals._load;
  internals._load = function patched(this: unknown, request: string, ...rest: unknown[]): unknown {
    if (request === "simple-zstd") {
      return new Proxy({}, { get: () => () => { throw new Error("zstd tidak terpasang; sinkron sesi S3 tidak tersedia."); } });
    }
    return original.call(this, request, ...rest);
  } as Loader;
}
