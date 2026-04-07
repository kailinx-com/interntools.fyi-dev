import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  HeroSection,
  StatsBar,
  CommunityNotesSection,
  FeatureHighlights,
} from "@/components/landing";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "interntools.fyi | Intern offer comparison & paycheck calculator",
  description:
    "Compare internship offers side-by-side, estimate take-home pay for all 50 states, and browse real offer outcomes from the community — free tools for interns and early-career students.",
};

export default function HomePage() {
  return (
    <PageShell>
      <HeroSection />
      <StatsBar />
      <CommunityNotesSection />
      <FeatureHighlights />

      {/* Sign-up CTA */}
      <section className="py-24 bg-primary/5 dark:bg-primary/10 border-t border-primary/20">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Ready to make a smarter offer decision?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Create a free account to save paycheck scenarios, compare offers, and contribute to the community.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg text-sm font-semibold shadow hover:bg-primary/90 transition-colors"
            >
              Get started for free
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/offers"
              className="inline-flex items-center gap-2 border border-border bg-card px-6 py-3 rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
            >
              Browse the community
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">No credit card required.</p>
        </div>
      </section>
    </PageShell>
  );
}
