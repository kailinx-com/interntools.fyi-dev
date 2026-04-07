import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { CompareOffers } from "@/components/offers/CompareOffers";

export default function CompareOffersPage() {
  return (
    <PageShell>
      <Suspense>
        <CompareOffers />
      </Suspense>
    </PageShell>
  );
}
