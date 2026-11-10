import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { cafeInfo } from "@/data/cafe";
import { menuItems } from "@/data/menu";
import { galleryPhotos } from "@/data/gallery";
import { testimonials } from "@/data/testimonials";
import { locationFaqs, transportGuides } from "@/data/location";
import type { PublicContent, MenuItem } from "@/types";

/** Request-scoped memoization: admin saves are visible on the next navigation. */
export const getPublicContent = cache(async (): Promise<PublicContent> => {
  // CMS content is request-scoped and must not be fetched during prerender.
  await connection();
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
  // Local-first: SQLite is the only runtime source until an explicit future migration.
  if (process.env.CONTENT_SOURCE !== "supabase") {
    try {
      const { readDevContent } = await import("@/lib/db/dev-sqlite");
      return readDevContent();
    } catch (err) {
      console.warn("[content] SQLite dev gagal, memakai data lokal:", err instanceof Error ? err.message : err);
      return fallback;
    }
  }

  const { getServiceSupabase } = await import("@/lib/supabase/server");
  const db = getServiceSupabase();
  if (!db) return fallback;

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
        "[content] Supabase query returned error, using local fallback content:",
        menuResult.error?.message || contentResult.error?.message,
      );
      return fallback;
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
          : menuItems,
      gallery: entries.gallery ?? galleryPhotos,
      testimonials: entries.testimonials ?? [],
      faq: entries.faq ?? locationFaqs,
      location: entries.location ?? transportGuides,
      configured: true,
    };
  } catch (err) {
    console.warn(
      "[content] Supabase unreachable or timed out, using local fallback content:",
      err instanceof Error ? err.message : err,
    );
    return fallback;
  }
});

export async function getCafeInfo(): Promise<PublicContent["cafe"]> {
  return (await getPublicContent()).cafe;
}
export async function getMenuItems(): Promise<MenuItem[]> {
  return (await getPublicContent()).menu;
}

// Local examples remain in data/*.ts for review. Never seed invented reviews as real endorsements.
export const exampleTestimonialCount = testimonials.length;
