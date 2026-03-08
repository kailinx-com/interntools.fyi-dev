import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "Housing Tools | interntools.fyi",
  description:
    "Housing tooling for interns is in progress. Check back soon for city-level housing insights.",
};

export default function HousingPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-14 md:py-20">
        <div className="rounded-xl border bg-card p-6 md:p-8">
          <h1 className="text-2xl font-semibold">Housing tools coming soon</h1>
          <p className="text-muted-foreground mt-3">
            We are building housing search and city comparison features for
            interns. This page is intentionally a placeholder for now.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
