import ModuleSkeleton from "@/components/admin/ui/ModuleSkeleton";

/** Tampil seketika saat pindah halaman dashboard, sementara server memeriksa sesi dan menyiapkan halaman. */
export default function DashboardLoading(): React.JSX.Element {
  return <ModuleSkeleton />;
}
