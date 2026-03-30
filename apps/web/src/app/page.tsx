import type { Metadata } from "next";
import {
  HeroSection,
  StatsBar,
  CommunityNotesSection,
  FeatureHighlights,
} from "@/components/landing";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "interntools.fyi | Paycheck calculator & planner",
  description:
    "Estimate take-home pay and plan expenses against your net income for internships and early-career roles.",
};

export default function HomePage() {
  return (
    <PageShell>
      <HeroSection />
      <StatsBar />
      <CommunityNotesSection />
      <FeatureHighlights />
    </PageShell>
  );
}
