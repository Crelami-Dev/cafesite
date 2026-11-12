import Skeleton from "./Skeleton";

/** Kerangka halaman modul: dipakai saat kode modul atau datanya masih dimuat. */
export default function ModuleSkeleton(): React.JSX.Element {
  return (
    <div className="grid gap-4 md:gap-5" aria-busy="true">
      <div className="flex items-end justify-between gap-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-11 w-32" />
      </div>
      <Skeleton className="h-12" />
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="hidden h-32 md:block" />
        <Skeleton className="hidden h-32 md:block" />
      </div>
    </div>
  );
}
