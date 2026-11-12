import { AdmissionsSection } from "@/components/AdmissionsSection";
import { CampusSpacesSection } from "@/components/CampusSpacesSection";
import { CurriculumExplorer } from "@/components/CurriculumExplorer";
import { SchoolClientMotion } from "@/components/SchoolClientMotion";
import { SchoolHeader } from "@/components/SchoolHeader";
import { SchoolHero } from "@/components/SchoolHero";
import { VisitBookingFooter } from "@/components/VisitBookingFooter";

export default function SchoolHomePage() {
  return (
    <SchoolClientMotion>
      <SchoolHeader />
      <main>
        <SchoolHero />
        <CurriculumExplorer />
        <CampusSpacesSection />
        <AdmissionsSection />
      </main>
      <VisitBookingFooter />
    </SchoolClientMotion>
  );
}

