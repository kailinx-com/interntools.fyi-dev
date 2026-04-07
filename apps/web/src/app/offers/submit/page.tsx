import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { SubmitOfferForm } from "@/components/offers/SubmitOfferForm";

export default function SubmitOfferPage() {
  return (
    <PageShell>
      <Suspense fallback={null}>
        <SubmitOfferForm />
      </Suspense>
    </PageShell>
  );
}
