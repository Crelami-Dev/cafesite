import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL, siteConfig } from "@/config/site";
import { buildWebSiteJsonLd } from "@/lib/seo";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${siteConfig.siteName} — Kopi Kurasi & Ruang Tenang`,
    template: "%s — CafeSite",
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: `${siteConfig.siteName} — Kopi Kurasi & Ruang Tenang`,
    description: siteConfig.description,
    url: SITE_URL,
    siteName: siteConfig.siteName,
    locale: siteConfig.locale,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: siteConfig.siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.siteName} — Kopi Kurasi & Ruang Tenang`,
    description: siteConfig.description,
    images: [`${SITE_URL}/opengraph-image`],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-scroll-behavior="smooth" className={`${playfair.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen bg-charcoal text-offwhite font-sans antialiased">
        {/* Structured data — LocalBusiness & WebSite (SEO / AI search) */}
        <JsonLd data={buildWebSiteJsonLd()} />

        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[120] focus:px-4 focus:py-2 focus:bg-terracotta focus:text-offwhite focus:rounded-md focus:text-sm focus:font-medium"
        >
          Langsung ke konten utama
        </a>

        {children}
      </body>
    </html>
  );
}
