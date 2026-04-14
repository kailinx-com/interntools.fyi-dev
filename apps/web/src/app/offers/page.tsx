import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { OffersFeed } from "@/components/offers/OffersFeed";

export default function OffersPage() {
  return (
    <PageShell>
      <Suspense>
        <OffersFeed />
      </Suspense>
    </PageShell>
  );
}
