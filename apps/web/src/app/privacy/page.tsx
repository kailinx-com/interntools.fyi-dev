import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "Privacy Policy | interntools.fyi",
  description:
    "Privacy policy for interntools.fyi and information about how data is handled.",
};

export default function PrivacyPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-14 md:py-20 space-y-6">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="text-muted-foreground">
          We currently collect minimal usage data needed to operate the site.
          We do not sell personal data.
        </p>
        <p className="text-muted-foreground">
          This page is a starter policy and should be replaced with a finalized
          legal version before production launch.
        </p>
        <div id="cookies" className="rounded-lg border bg-card p-4">
          <h2 className="text-lg font-medium">Cookie Settings</h2>
          <p className="text-muted-foreground mt-2">
            Cookie controls are not yet available in the UI. For now, manage
            cookies through your browser settings.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
