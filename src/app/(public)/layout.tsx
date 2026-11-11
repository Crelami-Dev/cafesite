import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StickyMobileCTA } from "@/components/layout/StickyMobileCTA";
import { PublicContentProvider } from "@/components/layout/PublicContentProvider";
import { PublicEffects } from "@/components/layout/PublicEffects";
import { PublicMotion } from "@/components/layout/PublicMotion";
import { getPublicContent } from "@/lib/content";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildLocalBusinessJsonLd } from "@/lib/seo";
export const metadata: Metadata = {
  other: { "page-type": "place", "site-kind": "other", "page-kind": "place" },
};
export default async function PublicLayout({
  children,
}: {
  children: ReactNode;
}): Promise<React.JSX.Element> {
  const content = await getPublicContent();
  return (
    <PublicContentProvider data={content}>
      {content.cafeConfirmed && (
        <JsonLd data={buildLocalBusinessJsonLd(content.cafe)} />
      )}
      <div
        className="cafe-public"
        data-type="place"
        data-preview={!content.configured || !content.cafeConfirmed}
      >
        <Navbar />
        {(!content.configured || !content.cafeConfirmed) && (
          <aside className="preview-notice">
            Pratinjau · Informasi kedai masih contoh.
          </aside>
        )}
        <main id="main-content" className="public-main">
          {children}
        </main>
        <Footer />
        <StickyMobileCTA />
        <PublicEffects />
        <PublicMotion />
      </div>
    </PublicContentProvider>
  );
}
