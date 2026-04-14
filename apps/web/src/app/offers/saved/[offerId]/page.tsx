"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { fetchOffer, type Offer } from "@/lib/offers/api";
import { formatOfferCompensationLine } from "@/lib/offers/formatOffer";
import { formatSavedItemTimestamp } from "@/lib/paycheck/api";

const employmentLabel: Record<string, string> = {
  internship: "Internship",
  coop: "Co-op",
  full_time: "Full-time",
};

const compensationLabel: Record<string, string> = {
  hourly: "Hourly",
  monthly: "Monthly",
};

export default function SavedOfferPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const rawId = params.offerId;
  const offerId = typeof rawId === "string" ? Number.parseInt(rawId, 10) : Number.NaN;

  const [offer, setOffer] = useState<Offer | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated || !token) {
      router.replace(`/login?redirect=/offers/saved/${rawId}`);
      return;
    }
    if (!Number.isFinite(offerId)) {
      setLoadError("Invalid offer.");
      return;
    }
    let cancelled = false;
    setLoadError(null);
    fetchOffer(token, offerId)
      .then((o) => {
        if (!cancelled) setOffer(o);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Could not load this offer. It may have been deleted.");
          setOffer(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, isAuthenticated, token, offerId, rawId, router]);

  if (isAuthLoading || (!isAuthenticated && !token)) {
    return (
      <PageShell>
        <div className="flex min-h-[40vh] items-center justify-center p-8">
          <Spinner className="size-8" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl space-y-6 p-4 pb-16 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2" asChild>
            <Link href="/me">
              <ArrowLeft className="size-4" />
              My account
            </Link>
          </Button>
        </div>

        {loadError ? (
          <p className="text-destructive text-sm" role="alert">
            {loadError}
          </p>
        ) : null}

        {!loadError && !offer ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-8" />
          </div>
        ) : null}

        {offer ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {offer.company} — {offer.title}
              </CardTitle>
              <CardDescription>
                Saved offer · Updated {formatSavedItemTimestamp(offer.updatedAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Employment</dt>
                  <dd className="font-medium">
                    {offer.employmentType != null
                      ? employmentLabel[offer.employmentType] ?? offer.employmentType
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Compensation type</dt>
                  <dd className="font-medium">
                    {offer.compensationType != null
                      ? compensationLabel[offer.compensationType] ?? offer.compensationType
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Pay</dt>
                  <dd className="font-medium">{formatOfferCompensationLine(offer)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Hours / week</dt>
                  <dd className="font-medium">{offer.hoursPerWeek ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Office location</dt>
                  <dd className="font-medium">{offer.officeLocation ?? "—"}</dd>
                </div>
                {offer.daysInOffice != null ? (
                  <div>
                    <dt className="text-muted-foreground">Days in office</dt>
                    <dd className="font-medium">{offer.daysInOffice}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="default" size="sm" className="gap-2" asChild>
                  <Link href={`/offers/compare?offer=${offer.id}`}>
                    <ArrowLeftRight className="size-4" />
                    Compare side-by-side
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/offers/submit?offerId=${offer.id}`}>Post an update</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PageShell>
  );
}
