import type { ReactNode } from "react";
import { dashboardNavigation } from "@/lib/admin-navigation";
import {
  CoffeeBeanIcon,
  CupIcon,
  ChartIcon,
  ChatIcon,
  GalleryIcon,
  HomeIcon,
  InfoIcon,
  MapPinIcon,
  QuoteIcon,
  ReceiptIcon,
  ShieldIcon,
  TableIcon,
} from "@/components/ui/icons";

export type NavItem = (typeof dashboardNavigation)[number];

export const NAV_GROUPS = ["Kedai", "Operasional", "Konten", "Pengelolaan"] as const;

/** Label singkat untuk bottom-nav / rail agar tidak terpotong. */
const SHORT_LABEL: Partial<Record<NavItem["id"], string>> = {
  summary: "Ringkasan",
  orders: "Pesanan",
  menu: "Menu",
  tables: "Meja",
  wa_bot: "WA Bot",
};

export function shortLabel(item: NavItem): string {
  return SHORT_LABEL[item.id] ?? item.label;
}

export function navIcon(id: NavItem["id"], className = "size-5"): ReactNode {
  switch (id) {
    case "summary":
      return <HomeIcon className={className} />;
    case "orders":
      return <ReceiptIcon className={className} />;
    case "menu":
      return <CupIcon className={className} />;
    case "tables":
      return <TableIcon className={className} />;
    case "wa_bot":
      return <ChatIcon className={className} />;
    case "cafe":
      return <CoffeeBeanIcon className={className} />;
    case "gallery":
      return <GalleryIcon className={className} />;
    case "testimonials":
      return <QuoteIcon className={className} />;
    case "faq":
      return <InfoIcon className={className} />;
    case "location":
      return <MapPinIcon className={className} />;
    case "reports":
      return <ChartIcon className={className} />;
    case "modules":
      return <ShieldIcon className={className} />;
  }
}

const MOBILE_PRIORITY: NavItem["id"][] = ["summary", "orders", "menu", "tables", "reports", "cafe"];

/** Tiga slot bottom-nav: prioritas tetap, disaring menurut izin akun. */
export function mobileSlots(available: readonly NavItem[]): NavItem[] {
  const slots: NavItem[] = [];
  for (const id of MOBILE_PRIORITY) {
    const found = available.find((n) => n.id === id);
    if (found) slots.push(found);
    if (slots.length === 3) break;
  }
  return slots;
}

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/dashboard") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
