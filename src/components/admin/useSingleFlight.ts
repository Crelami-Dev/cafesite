"use client";
import { useCallback, useRef, useState } from "react";

/**
 * Penjaga klik ganda yang berlaku SEKETIKA (memakai ref, bukan menunggu render ulang React).
 * Selama `run` masih berjalan, pemanggilan berikutnya diabaikan. `pending` dipakai untuk menonaktifkan
 * tombol dan menampilkan teks "Menyimpan…".
 *
 *   const { run, pending } = useSingleFlight();
 *   <form onSubmit={(e) => { e.preventDefault(); void run(save); }}>
 */
export function useSingleFlight(): {
  run: <T>(task: () => Promise<T>) => Promise<T | undefined>;
  pending: boolean;
} {
  const flying = useRef(false);
  const [pending, setPending] = useState(false);
  const run = useCallback(async <T,>(task: () => Promise<T>): Promise<T | undefined> => {
    if (flying.current) return undefined;
    flying.current = true;
    setPending(true);
    try {
      return await task();
    } finally {
      flying.current = false;
      setPending(false);
    }
  }, []);
  return { run, pending };
}

/**
 * Seperti useSingleFlight, tetapi per kunci (mis. id baris): beberapa baris boleh diproses bersamaan,
 * namun satu baris yang sama tidak bisa diproses dua kali. `isPending(id)` untuk menonaktifkan baris itu.
 */
export function useKeyedFlight(): {
  run: <T>(key: string, task: () => Promise<T>) => Promise<T | undefined>;
  isPending: (key: string) => boolean;
  pendingKeys: ReadonlySet<string>;
} {
  const flying = useRef(new Set<string>());
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(new Set());
  const run = useCallback(async <T,>(key: string, task: () => Promise<T>): Promise<T | undefined> => {
    if (flying.current.has(key)) return undefined;
    flying.current.add(key);
    setPendingKeys(new Set(flying.current));
    try {
      return await task();
    } finally {
      flying.current.delete(key);
      setPendingKeys(new Set(flying.current));
    }
  }, []);
  const isPending = useCallback((key: string) => pendingKeys.has(key), [pendingKeys]);
  return { run, isPending, pendingKeys };
}
