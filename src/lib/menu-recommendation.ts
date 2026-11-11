import type { MenuItem } from "@/types";
import {
  FALLBACK_REASON_ANY,
  FALLBACK_REASON_CATEGORY,
  FALLBACK_REASON_EMPTY,
  FLAVOR_KEYWORDS,
  FLAVOR_TAG_MAP,
  GENERIC_REASONS,
  RECOMMENDATION_REASONS,
  type FlavorId,
} from "@/data/menu-picker";

export interface RecommendationResult {
  /** null hanya bila tidak ada item tersedia sama sekali. */
  item: MenuItem | null;
  /** Kalimat alasan singkat, selalu terisi. */
  reason: string;
  /** true bila item cocok dengan rasa yang dipilih (skor > 0), false untuk fallback. */
  matched: boolean;
}

const TAG_WEIGHT = 2;
const KEYWORD_WEIGHT = 1;

function isFlavorId(id: string): id is FlavorId {
  return Object.prototype.hasOwnProperty.call(FLAVOR_TAG_MAP, id);
}

function scoreItem(item: MenuItem, flavorId: string): number {
  if (!isFlavorId(flavorId)) return 0;

  const itemTags: string[] = Array.isArray(item.tags) ? item.tags : [];
  const tags = new Set(itemTags.map((tag) => String(tag).trim().toLowerCase()));
  const text = `${item.name ?? ""} ${item.description ?? ""}`.toLowerCase();

  let score = 0;
  for (const tag of FLAVOR_TAG_MAP[flavorId]) {
    if (tags.has(tag.toLowerCase())) score += TAG_WEIGHT;
  }
  for (const keyword of FLAVOR_KEYWORDS[flavorId]) {
    if (text.includes(keyword)) score += KEYWORD_WEIGHT;
  }
  return score;
}

/** Skor tertinggi menang; seri -> isFeatured; seri lagi -> urutan asli. */
function pickBest(items: MenuItem[], flavorId: string): { item: MenuItem; score: number } | null {
  let best: { item: MenuItem; score: number } | null = null;
  for (const item of items) {
    const score = scoreItem(item, flavorId);
    if (
      best === null ||
      score > best.score ||
      (score === best.score && item.isFeatured === true && best.item.isFeatured !== true)
    ) {
      best = { item, score };
    }
  }
  return best;
}

function fillName(template: string, item: MenuItem): string {
  return template.replace("{name}", item.name);
}

function pickFeaturedOrFirst(items: MenuItem[]): MenuItem | null {
  return items.find((item) => item.isFeatured === true) ?? items[0] ?? null;
}

/** Pure: tanpa I/O, tidak pernah throw. */
export function getMenuRecommendation(
  items: MenuItem[],
  cravingId: string,
  flavorId: string,
): RecommendationResult {
  const available = (Array.isArray(items) ? items : []).filter(
    (item) => item.isAvailable !== false,
  );

  const inCategory = available.filter((item) => item.category === cravingId);
  const best = pickBest(inCategory, flavorId);

  if (best !== null && best.score > 0) {
    // best.score > 0 hanya mungkin jika flavorId valid, jadi cast ini aman.
    const reason =
      RECOMMENDATION_REASONS[`${best.item.id}:${flavorId}`] ??
      fillName(GENERIC_REASONS[flavorId as FlavorId], best.item);
    return { item: best.item, reason, matched: true };
  }

  const categoryPick = pickFeaturedOrFirst(inCategory);
  if (categoryPick !== null) {
    return { item: categoryPick, reason: fillName(FALLBACK_REASON_CATEGORY, categoryPick), matched: false };
  }

  const anyPick = pickFeaturedOrFirst(available);
  if (anyPick !== null) {
    return { item: anyPick, reason: fillName(FALLBACK_REASON_ANY, anyPick), matched: false };
  }

  return { item: null, reason: FALLBACK_REASON_EMPTY, matched: false };
}

/** Alias untuk kesesuaian dengan HOMEPAGE_TASKS.md spec. */
export const recommendMenu = getMenuRecommendation;

