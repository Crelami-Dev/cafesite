import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { cafeInfo } from "@/data/cafe";
import { menuItems } from "@/data/menu";
import { galleryPhotos } from "@/data/gallery";
import { testimonials } from "@/data/testimonials";
import { locationFaqs, transportGuides } from "@/data/location";
import type { PublicContent, MenuItem } from "@/types";

  async function readSupabaseContent(fallback: PublicContent): Promise<PublicContent | null> {
    const { getServiceSupabase } = await import("@/lib/supabase/server");
    const db = getServiceSupabase();
    if (!db) return null;

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase query timeout (1500ms)")), 1500),
      );

      const [menuResult, contentResult] = await Promise.race([
        Promise.all([
          db
            .from("menu_items")
            .select("id,data,is_available,sort_order")
            .order("sort_order"),
          db.from("content").select("key,data"),
        ]),
        timeoutPromise,
      ]);

      if (menuResult.error || contentResult.error) {
        console.warn(
          "[content] Supabase query returned error:",
          menuResult.error?.message || contentResult.error?.message,
        );
        return null;
      }

      const entries = Object.fromEntries(
        (contentResult.data ?? []).map((row) => [row.key, row.data]),
      );

      return {
        cafeConfirmed: Boolean(entries.cafe),
        cafe: entries.cafe ?? cafeInfo,
        menu:
          menuResult.data && menuResult.data.length > 0
            ? menuResult.data.map(
              (row) =>
                ({
                  ...row.data,
                  id: row.id,
                  isAvailable: row.is_available,
                }) as MenuItem,
            )
          : fallback.menu,
  categories:
Array.isArray(entries.categories) && entries.categories.length > 0
  ? entries.categories
  : Array.isArray(entries.cafe?.categories) && entries.cafe.categories.length > 0
    ? entries.cafe.categories
    : undefined,
  gallery: entries.gallery ?? galleryPhotos,
    testimonials: entries.testimonials ?? [],
      faq: entries.faq ?? locationFaqs,
        location: entries.location ?? transportGuides,
          configured: true,
    };
  } catch (err) {
  console.warn(
    "[content] Supabase unreachable or timed out:",
    err instanceof Error ? err.message : err,
  );
  return null;
}
}

export const PUBLIC_CONTENT_TAG = "public-content";

async function loadPublicContent(): Promise<PublicContent> {
  const fallback: PublicContent = {
    cafeConfirmed: false,
    cafe: cafeInfo,
    menu: menuItems,
    gallery: galleryPhotos,
    testimonials: [],
    faq: locationFaqs,
    location: transportGuides,
    configured: false,
  };

  const { ensureCloudSqliteSync, isCloudPrimaryEnv } = await import("@/lib/server/cloud-sync");
  await ensureCloudSqliteSync();

  // Mode Hybrid (default): Jika SQLite terdeteksi, baca dari SQLite dulu; jika SQLite gagal, fallback ke Cloud Supabase.
  if (!isCloudPrimaryEnv()) {
    try {
      const { readDevContent } = await import("@/lib/db/dev-sqlite");
      return readDevContent();
    } catch (err) {
      console.warn("[content] SQLite tidak tersedia, mencoba Cloud Supabase:", err instanceof Error ? err.message : err);
      const cloud = await readSupabaseContent(fallback);
      return cloud ?? fallback;
    }
  }

  // Mode Cloud (domain serverless / CONTENT_SOURCE=supabase): Baca dari Supabase dulu; jika gangguan, fallback ke SQLite lokal.
  const cloud = await readSupabaseContent(fallback);
  if (cloud) return cloud;
  try {
    const { readDevContent } = await import("@/lib/db/dev-sqlite");
    return readDevContent();
  } catch {
    return fallback;
  }
}

const loadPublicContentCached = unstable_cache(loadPublicContent, ["public-content-v1"], {
  tags: [PUBLIC_CONTENT_TAG],
  // Jaring pengaman bila data berubah di luar dashboard; simpanan admin menginvalidasi lewat tag.
  revalidate: 60,
});

/**
 * Konten publik di-cache lintas request (tag `public-content`, revalidate 60 dtk).
 * Dashboard admin memanggil revalidateTag agar perubahan langsung terlihat.
 */
export const getPublicContent = cache(
  async (): Promise<PublicContent> => loadPublicContentCached(),
);

export async function getCafeInfo(): Promise<PublicContent["cafe"]> {
  return (await getPublicContent()).cafe;
}
export async function getMenuItems(): Promise<MenuItem[]> {
  return (await getPublicContent()).menu;
}

// Local examples remain in data/*.ts for review. Never seed invented reviews as real endorsements.
export const exampleTestimonialCount = testimonials.length;
