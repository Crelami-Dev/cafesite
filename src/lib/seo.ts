import type { Metadata } from "next";
import { SITE_URL, siteConfig } from "@/config/site";
import { cafeInfo } from "@/data/cafe";
import type { CafeInfo } from "@/types";

const OG_IMAGE = `${SITE_URL}/opengraph-image`;
const OG_IMAGE_SIZE = { width: 1200, height: 630 };

type CreatePageMetadataArgs = {
  /** Judul halaman saja (brand ditambahkan otomatis). */
  title: string;
  /** Deskripsi spesifik halaman, keyword-rich sesuai isi page. */
  description?: string;
  /** Path route (mis. "/menu"), untuk canonical + og:url. */
  path: string;
  /** Kata kunci tambahan spesifik halaman. */
  keywords?: string[];
};

/**
 * Builder metadata halaman seragam: title template, description, canonical,
 * Open Graph, Twitter Card, robots. Dipakai semua halaman agar konsisten
 * dan memudahkan index oleh Google & AI search (Gemini/ChatGPT, dll).
 */
export function createPageMetadata({
  title,
  description,
  path,
  keywords,
}: CreatePageMetadataArgs): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogTitle = `${title} — ${siteConfig.siteName}`;

  return {
    title,
    description: description ?? siteConfig.description,
    keywords: keywords
      ? [...siteConfig.keywords, ...keywords]
      : siteConfig.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: ogTitle,
      description: description ?? siteConfig.description,
      url,
      siteName: siteConfig.siteName,
      locale: siteConfig.locale,
      type: "website",
      images: [{ url: OG_IMAGE, ...OG_IMAGE_SIZE, alt: siteConfig.siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: description ?? siteConfig.description,
      images: [OG_IMAGE],
    },
  };
}

const DAY_ORDER = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

/**
 * JSON-LD CafeOrCoffeeShop (LocalBusiness) — di-inject di layout agar tiap
 * halaman mengiklankan entitas kafe yang sama ke Google & AI search.
 */
export function buildLocalBusinessJsonLd(
  cafe: CafeInfo = cafeInfo,
): Record<string, unknown> {
  const openingHoursSpecification = cafe.openingHours
    .map((hour, index) =>
      hour.isOpen && hour.openTime && hour.closeTime
        ? {
            "@type": "OpeningHoursSpecification" as const,
            dayOfWeek: DAY_ORDER[index],
            opens: hour.openTime,
            closes: hour.closeTime,
          }
        : null,
    )
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: cafe.name,
    alternateName: siteConfig.siteName,
    url: SITE_URL,
    image: OG_IMAGE,
    description: siteConfig.description,
    servesCuisine: "Coffee, Kopi Nusantara, Hidangan Kafe",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: cafe.address,
      addressLocality: cafe.city,
      addressCountry: "ID",
    },
    openingHoursSpecification,
    telephone: cafe.whatsappFormatted,
    sameAs: [cafe.instagramUrl, cafe.googleMapsUrl],
  };
}

/**
 * JSON-LD FAQPage — sangat membantu muncul sebagai rich result di Google
 * dan sumber jawaban langsung untuk Gemini/AI search (pertanyaan soal
 * Wi-Fi, colokan, smoking area, musholla, rombongan, dll).
 */
export function buildFaqJsonLd(
  faqs: Array<{ question: string; answer: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * JSON-LD WebSite — memudahkan bot memahami situs & mendukung pengecekan
 * kehadiran organisasi/brand oleh search engine & AI.
 */
export function buildWebSiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.siteName,
    url: SITE_URL,
    inLanguage: "id-ID",
    description: siteConfig.description,
  };
}
