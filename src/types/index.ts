/**
 * Central TypeScript Type Definitions for CafeSite
 * Single source of truth across components, data, and utilities.
 */

export type StandardMenuCategory = "coffee" | "non-coffee" | "food" | "snack" | "dessert";
export type MenuCategory = StandardMenuCategory | (string & {});

export interface MenuCategoryMeta {
  id: string;
  name: string;
  description: string;
  icon?: string;
  image?: string;
  sort_order?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image?: string;
  tags?: string[];
  isFeatured?: boolean;
  isAvailable?: boolean;
}

export interface OpeningHour {
  day: string;
  hours: string;
  isOpen: boolean;
  openTime?: string;  // e.g. "08:00" (format 24 jam)
  closeTime?: string; // e.g. "22:00" (format 24 jam)
  notes?: string;     // e.g. "Last order 21:30"
}

export interface CafeInfo {
  name: string;
  tagline: string;
  address: string;
  city: string;
  landmark?: string;
  openingHours: OpeningHour[];
  whatsapp: string;          // Format internasional tanpa plus/tanda, e.g. "6281234567890"
  whatsappFormatted: string; // Tampilan manusia, e.g. "+62 812-3456-7890"
  instagram: string;         // e.g. "@CafeSite"
  instagramUrl: string;      // e.g. "https://instagram.com/CafeSite"
  googleMapsUrl: string;     // Deep link aplikasi Google Maps
  googleMapsEmbedUrl?: string;
}

export type GalleryCategory = "interior" | "exterior" | "coffee" | "food" | "atmosphere";

export interface GalleryPhoto {
  id: string;
  category: GalleryCategory;
  caption: string;
  aspect: "portrait" | "landscape" | "square";
  year?: string;
  title?: string;
  src?: string;
  alt?: string;
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category: GalleryCategory;
  aspectRatio?: "1:1" | "16:9" | "4:5" | "3:2";
  caption?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  source: string; // e.g. "Google Maps Review"
  rating: number; // 1 s/d 5
  comment: string;
  date?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: "facility" | "menu" | "reservation" | "general";
}

export interface TransportGuideItem {
  id: string;
  title: string;
  description: string;
  detail?: string;
  icon: "parking" | "landmark" | "transit";
}

export interface LocationFaqItem {
  id: string;
  question: string;
  answer: string;
}

export type WhatsAppContext = "general" | "reservation" | "menu_inquiry" | "group_booking";

export interface PublicContent {
  cafeConfirmed: boolean;
  cafe: CafeInfo;
  menu: MenuItem[];
  categories?: MenuCategoryMeta[];
  gallery: GalleryPhoto[];
  testimonials: Testimonial[];
  faq: LocationFaqItem[];
  location: TransportGuideItem[];
  configured: boolean;
}

export interface PublicIntroProps { label: string; title: string; description: string }
export interface CafePhotoProps { src: string; alt: string; className?: string; moment?: boolean; reveal?: boolean; priority?: boolean; sizes?: string }
/** Jenis animasi masuk saat di-scroll (lihat lib/motion.ts). */
export type RevealKind = "rise" | "wipe" | "ticket";
export interface VisitPanelProps { cafe: CafeInfo; configured: boolean }

export interface PublicContentProviderProps {
  data: PublicContent;
  children: React.ReactNode;
}

export interface SiteShellProps {
  children: React.ReactNode;
  footer: React.ReactNode;
  floatingContact: React.ReactNode;
}

export * from "./operations";
export * from "./admin";
export * from "./ordering";
