import type { Metadata } from "next";
import {
  HeroSection,
  StatsBar,
  CommunityNotesSection,
  FeatureHighlights,
} from "@/components/landing";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "interntools.fyi | Intern Housing & Paycheck Tools",
  description:
    "Tools for interns to explore housing signals, estimate paycheck outcomes, and plan monthly budgets.",
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
