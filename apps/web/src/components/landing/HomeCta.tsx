"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

function AnonymousCta() {
  return (
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
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg text-sm font-semibold shadow hover:bg-primary/90 transition-colors"
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
          <Link
            href="/search"
            className="inline-flex items-center gap-2 border border-border bg-card px-6 py-3 rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
          >
            Search by location
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">No credit card required.</p>
      </div>
    </section>
  );
}

function AuthenticatedCta() {
  return (
    <section className="py-24 bg-primary/5 dark:bg-primary/10 border-t border-primary/20">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Keep exploring your tools
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Your dashboard, comparisons, and saved offers are ready.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/me"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg text-sm font-semibold shadow hover:bg-primary/90 transition-colors"
          >
            My Dashboard
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/offers/compare"
            className="inline-flex items-center gap-2 border border-border bg-card px-6 py-3 rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
          >
            Compare Offers
          </Link>
          <Link
            href="/offers"
            className="inline-flex items-center gap-2 border border-border bg-card px-6 py-3 rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
          >
            Browse Community
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomeCta() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && isAuthenticated) {
    return <AuthenticatedCta />;
  }

  return <AnonymousCta />;
}
