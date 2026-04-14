import type { Metadata } from "next";
import {
  HomeLandingSections,
  CommunityNotesSection,
  FeatureHighlights,
} from "@/components/landing";
import { HomeCta } from "@/components/landing/HomeCta";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "interntools.fyi | Intern offer comparison & paycheck calculator",
  description:
    "Compare internship offers side-by-side, estimate take-home pay for all 50 states, and browse real offer outcomes from the community — free tools for interns and early-career students.",
};

export default function HomePage() {
  return (
    <PageShell>
      <HomeLandingSections />
      <CommunityNotesSection />
      <FeatureHighlights />

      <HomeCta />
    </PageShell>
  );
}
