import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "Terms of Service | interntools.fyi",
  description: "Terms of service for using interntools.fyi.",
};

export default function TermsPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-14 md:py-20 space-y-6">
        <h1 className="text-3xl font-semibold">Terms of Service</h1>
        <p className="text-muted-foreground">
          By using interntools.fyi, you agree to use these tools for
          informational purposes and to verify any decisions with official
          sources.
        </p>
        <p className="text-muted-foreground">
          This is a starter terms page and should be replaced with finalized
          legal terms before production launch.
        </p>
      </section>
    </PageShell>
  );
}
