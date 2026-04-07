"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { LockedPaycheckSection } from "@/components/paycheck/LockedPaycheckSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, ArrowUpRight, Calculator, FileText, Save } from "lucide-react";
import { LocationPicker } from "./LocationPicker";
import { getStoredPaycheckConfig, getStoredPlannerData } from "@/lib/paycheck/draft";
import { calculatePayroll, deriveFicaMode } from "@/lib/paycheck";
import {
  getCalculatorConfig,
  getPlannerDocument,
  listCalculatorConfigs,
  listPlannerDocuments,
  type SavedCalculatorConfigSummary,
  type SavedPlannerDocumentSummary,
} from "@/lib/paycheck/api";
import { saveCompareOffersDraft } from "@/lib/offers";
import { createComparison, fetchComparison, fetchOffer, fetchOffers, type Offer } from "@/lib/offers/api";

type EditableOffer = {
  uid: string;
  company: string;
  role: string;
  location: string;
  compensation: string;
  netTakeHome: string;
  allExpenses: string;
  commute: string;
  paycheckConfigId: string;
  paycheckLabel: string;
  plannerDocId: string;
  plannerLabel: string;
};

function emptyOffer(): EditableOffer {
  return {
    uid: crypto.randomUUID(),
    company: "",
    role: "",
    location: "",
    compensation: "",
    netTakeHome: "",
    allExpenses: "",
    commute: "",
    paycheckConfigId: "",
    paycheckLabel: "",
    plannerDocId: "",
    plannerLabel: "",
  };
}

export function parseMoney(s: string): number {
  return parseFloat(s.replace(/[^0-9.-]/g, "")) || 0;
}

export function fmtMoney(n: number): string {
  if (n === 0) return "—";
  const sign = n < 0 ? "-" : "";
  return sign + "$" + Math.round(Math.abs(n)).toLocaleString() + "/mo";
}

export function deriveMonthlyIncome(raw: string): number {
  const num = parseMoney(raw);
  if (num <= 0) return 0;
  const lower = raw.toLowerCase();
  if (lower.includes("/hr")) return num * 40 * 4.33;
  if (lower.includes("/yr") || lower.includes("/year")) return num / 12;
  return num;
}

type OfferExtras = {
  netTakeHome?: string;
  allExpenses?: string;
  commute?: string;
  paycheckConfigId?: string;
  paycheckLabel?: string;
  plannerDocId?: string;
  plannerLabel?: string;
};

function parseExtras(notes: string | null | undefined): OfferExtras {
  if (!notes) return {};
  try { return JSON.parse(notes) as OfferExtras; } catch { return {}; }
}

function offerToEditable(o: Offer): EditableOffer {
  const unitSuffix =
    o.compensationType === "hourly" ? "/hr" :
    o.compensationType === "monthly" ? "/mo" : "/yr";
  const compensation = o.payAmount ? `$${o.payAmount.toLocaleString()}${unitSuffix}` : "";
  const extras = parseExtras(o.notes);
  return {
    ...emptyOffer(),
    company: o.company ?? "",
    role: o.title ?? "",
    location: o.officeLocation ?? "",
    compensation,
    netTakeHome: extras.netTakeHome ?? "",
    allExpenses: extras.allExpenses ?? "",
    commute: extras.commute ?? "",
    paycheckConfigId: extras.paycheckConfigId ?? "",
    paycheckLabel: extras.paycheckLabel ?? "",
    plannerDocId: extras.plannerDocId ?? "",
    plannerLabel: extras.plannerLabel ?? "",
  };
}

export function CompareOffers() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const isLocked = !isAuthLoading && !isAuthenticated;

  const [offers, setOffers] = useState<EditableOffer[]>([emptyOffer(), emptyOffer()]);
  const [savedOffers, setSavedOffers] = useState<Offer[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<SavedCalculatorConfigSummary[]>([]);
  const [savedPlanners, setSavedPlanners] = useState<SavedPlannerDocumentSummary[]>([]);
  const [hasDraft, setHasDraft] = useState(false);
  const [hasPlannerDraft, setHasPlannerDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setHasDraft(!!getStoredPaycheckConfig());
    setHasPlannerDraft(getStoredPlannerData().expenses.length > 0);
  }, []);

  useEffect(() => {
    if (!token) return;
    setIsLoadingSaved(true);
    fetchOffers(token)
      .then(setSavedOffers)
      .catch(() => {})
      .finally(() => setIsLoadingSaved(false));
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    listCalculatorConfigs(token).then(setSavedConfigs).catch(() => {});
    listPlannerDocuments(token).then(setSavedPlanners).catch(() => {});
  }, [isAuthenticated, token]);

  useEffect(() => {
    const offerId = searchParams.get("offer");
    const comparisonId = searchParams.get("comparison");
    if (!token) return;
    if (offerId) {
      fetchOffer(token, Number(offerId))
        .then((o) => {
          setOffers((prev) => {
            const next = [...prev];
            next[0] = offerToEditable(o);
            return next;
          });
        })
        .catch(() => {});
    } else if (comparisonId) {
      fetchComparison(token, Number(comparisonId))
        .then(async (comparison) => {
          const ids = comparison.includedOfferIds ?? [];
          let editables: EditableOffer[];
          if (ids.length > 0) {
            const fetched = await Promise.all(ids.map((id) => fetchOffer(token, id)));
            editables = fetched.map(offerToEditable);
          } else if (comparison.computedMetrics) {
            const snapshots = JSON.parse(comparison.computedMetrics) as Partial<EditableOffer>[];
            editables = snapshots.map((s) => ({ ...emptyOffer(), ...s, uid: crypto.randomUUID() }));
          } else {
            return;
          }
          while (editables.length < 2) editables.push(emptyOffer());
          setOffers(editables);
        })
        .catch(() => {});
    }
  }, [searchParams, token]);

  const applyPaycheckConfig = useCallback(
    async (uid: string, configId: string) => {
      if (configId === "") {
        setOffers((prev) =>
          prev.map((o) =>
            o.uid === uid
              ? { ...o, paycheckConfigId: "", paycheckLabel: "", netTakeHome: "" }
              : o,
          ),
        );
        return;
      }

      if (configId === "draft") {
        const config = getStoredPaycheckConfig();
        if (!config) return;
        const ficaMode = deriveFicaMode(config);
        const payroll = calculatePayroll({ ...config, ficaMode });
        if (payroll.monthly.length > 0) {
          const avg =
            payroll.monthly.reduce((sum, m) => sum + m.netPay, 0) /
            payroll.monthly.length;
          setOffers((prev) =>
            prev.map((o) =>
              o.uid === uid
                ? { ...o, paycheckConfigId: "draft", paycheckLabel: "Calculator draft", netTakeHome: fmtMoney(avg) }
                : o,
            ),
          );
        }
        return;
      }

      if (!token) return;
      try {
        const detail = await getCalculatorConfig(token, Number(configId));
        const ficaMode = deriveFicaMode(detail.config);
        const payroll = calculatePayroll({ ...detail.config, ficaMode });
        if (payroll.monthly.length > 0) {
          const avg =
            payroll.monthly.reduce((sum, m) => sum + m.netPay, 0) /
            payroll.monthly.length;
          setOffers((prev) =>
            prev.map((o) =>
              o.uid === uid
                ? { ...o, paycheckConfigId: configId, paycheckLabel: detail.name, netTakeHome: fmtMoney(avg) }
                : o,
            ),
          );
        }
      } catch {
      }
    },
    [token],
  );

  const applyPlannerDoc = useCallback(
    async (uid: string, docId: string) => {
      if (docId === "") {
        setOffers((prev) =>
          prev.map((o) =>
            o.uid === uid ? { ...o, plannerDocId: "", plannerLabel: "", allExpenses: "" } : o,
          ),
        );
        return;
      }

      if (docId === "draft") {
        const pd = getStoredPlannerData();
        if (pd.expenses.length === 0) return;
        const total = pd.expenses.reduce((s, e) => s + e.defaultAmount, 0);
        setOffers((prev) =>
          prev.map((o) =>
            o.uid === uid
              ? { ...o, plannerDocId: "draft", plannerLabel: "Planner draft", allExpenses: fmtMoney(total) }
              : o,
          ),
        );
        return;
      }

      if (!token) return;
      try {
        const detail = await getPlannerDocument(token, docId);
        const total = detail.plannerData.expenses.reduce((s, e) => s + e.defaultAmount, 0);
        setOffers((prev) =>
          prev.map((o) =>
            o.uid === uid
              ? { ...o, plannerDocId: docId, plannerLabel: detail.name, allExpenses: fmtMoney(total) }
              : o,
          ),
        );
      } catch {
      }
    },
    [token],
  );

  function addOffer() {
    if (offers.length >= 4) return;
    setOffers((prev) => [...prev, emptyOffer()]);
  }

  function removeOffer(uid: string) {
    if (offers.length <= 2) return;
    setOffers((prev) => prev.filter((o) => o.uid !== uid));
  }

  function updateOffer(uid: string, field: keyof EditableOffer, value: string) {
    setOffers((prev) =>
      prev.map((o) => (o.uid === uid ? { ...o, [field]: value } : o)),
    );
  }

  function loadSavedOffer(savedOffer: Offer) {
    if (offers.length >= 4) return;
    setOffers((prev) => [
      ...prev,
      {
        ...emptyOffer(),
        company: savedOffer.company,
        role: savedOffer.title,
        location: savedOffer.officeLocation,
        compensation:
          savedOffer.compensationType === "hourly"
            ? `$${savedOffer.payAmount}/hr`
            : `$${savedOffer.payAmount.toLocaleString()}/mo`,
      },
    ]);
  }

  const summaries = useMemo(
    () =>
      offers.map((o) => {
        const explicitNet = parseMoney(o.netTakeHome);
        const derivedGross = deriveMonthlyIncome(o.compensation);
        const income = explicitNet > 0 ? explicitNet : derivedGross;

        const expenses = parseMoney(o.allExpenses);
        const leftover = income > 0 ? income - expenses : null;
        const rate =
          leftover !== null && income > 0
            ? Math.round((leftover / income) * 100)
            : null;

        return {
          income,
          expenses,
          leftover,
          rate,
          isEstimated: explicitNet <= 0 && derivedGross > 0,
        };
      }),
    [offers],
  );

  function handlePublish() {
    saveCompareOffersDraft({
      offers: offers
        .filter((o) => o.company.trim())
        .map((o) => ({
          id: o.uid,
          company: o.company,
          role: o.role,
          compensation: o.compensation,
        })),
    });
    router.push("/offers/submit?from=compare");
  }

  async function handleSave() {
    if (!token) return;
    const validOffers = offers.filter((o) => o.company.trim());
    if (validOffers.length < 2) {
      setSaveError("At least 2 offers with company names are required.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await createComparison(token, {
        name: validOffers.map((o) => o.company.trim()).join(" vs "),
        includedOfferIds: [],
        computedMetrics: JSON.stringify(
          validOffers.map((o, i) => ({
            company: o.company,
            role: o.role,
            location: o.location,
            compensation: o.compensation,
            netTakeHome: o.netTakeHome,
            allExpenses: o.allExpenses,
            commute: o.commute,
            paycheckConfigId: o.paycheckConfigId,
            paycheckLabel: o.paycheckLabel,
            plannerDocId: o.plannerDocId,
            plannerLabel: o.plannerLabel,
            leftover: summaries[i]?.leftover,
            savingsRate: summaries[i]?.rate,
          })),
        ),
      });

      setSaveSuccess(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }

  const cols = offers.length + 1;
  const gridClass =
    cols === 3 ? "grid-cols-3" : cols === 4 ? "grid-cols-4" : "grid-cols-5";

  const offerGridClass =
    offers.length === 2
      ? "md:grid-cols-2"
      : offers.length === 3
        ? "md:grid-cols-3"
        : "md:grid-cols-4";

  const hasConfigOptions = hasDraft || savedConfigs.length > 0;
  const hasPlannerOptions = hasPlannerDraft || savedPlanners.length > 0;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <LockedPaycheckSection
        locked={isLocked}
        title="Sign in to compare offers"
        description="Create a free account to use the offer comparison tool and save your results."
        className="min-h-screen"
        overlayClassName="items-start pt-32"
      >
      <div className="mx-auto max-w-5xl space-y-10 p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Compare Offers</h1>
            <p className="text-muted-foreground mt-2 max-w-md">
              Add your offers, fill in the numbers, and compare compensation,
              living costs, and net savings side-by-side.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" type="button" className="gap-2" onClick={addOffer} disabled={offers.length >= 4}>
              <Plus className="size-4" />
              Add Offer
            </Button>
            {isAuthenticated && (
              <Button variant="outline" type="button" className="gap-2" onClick={() => void handleSave()} disabled={isSaving}>
                {isSaving ? <Spinner className="size-4" /> : <Save className="size-4" />}
                Save
              </Button>
            )}
            <Button className="gap-2" onClick={handlePublish}>
              <ArrowUpRight className="size-4" />
              Publish
            </Button>
          </div>
        </div>

        {saveError && <p className="text-sm text-destructive">{saveError}</p>}
        {saveSuccess && (
          <p className="text-sm text-primary">
            Comparison saved to your account.{" "}
            <Link href="/me" className="underline">View in dashboard</Link>
          </p>
        )}

        {/* Import saved offers */}
        {isAuthenticated && savedOffers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Import from saved offers
            </p>
            <div className="flex flex-wrap gap-2">
              {savedOffers.map((so) => (
                <Button key={so.id} variant="outline" size="sm" className="gap-2" onClick={() => loadSavedOffer(so)} disabled={offers.length >= 4}>
                  <Plus className="size-3" />
                  {so.company} — {so.title}
                </Button>
              ))}
              {isLoadingSaved && <Spinner className="size-4" />}
            </div>
          </div>
        )}

        {/* Offer Cards */}
        <div className={`grid grid-cols-1 gap-6 ${offerGridClass}`}>
          {offers.map((offer, i) => (
            <Card key={offer.uid} className="relative shadow-none">
              {offers.length > 2 && (
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 size-7 text-muted-foreground hover:text-destructive" onClick={() => removeOffer(offer.uid)}>
                  <X className="size-4" />
                </Button>
              )}
              <CardContent className="pt-5 pb-5 px-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Option {String.fromCharCode(65 + i)}
                </p>
                <div className="space-y-2">
                  <Input placeholder="Company" value={offer.company} onChange={(e) => updateOffer(offer.uid, "company", e.target.value)} className="font-bold" />
                  <Input placeholder="Role" value={offer.role} onChange={(e) => updateOffer(offer.uid, "role", e.target.value)} className="text-sm" />
                  <LocationPicker value={offer.location} onChange={(loc) => updateOffer(offer.uid, "location", loc)} placeholder="Search city…" />
                </div>

                {hasConfigOptions && (
                  <div className="rounded-lg border border-primary/20 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calculator className="size-3.5 text-primary shrink-0" />
                      <span className="font-medium">Paycheck config</span>
                    </div>
                    <Select value={offer.paycheckConfigId} onValueChange={(v) => void applyPaycheckConfig(offer.uid, v)}>
                      <SelectTrigger className="h-8 text-xs w-full"><SelectValue placeholder="Select config…" /></SelectTrigger>
                      <SelectContent>
                        {hasDraft && <SelectItem value="draft">Calculator draft (local)</SelectItem>}
                        {savedConfigs.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {offer.paycheckLabel && (
                      <p className="text-xs text-primary">✓ Net take-home from <span className="font-semibold">{offer.paycheckLabel}</span></p>
                    )}
                  </div>
                )}

                {hasPlannerOptions && (
                  <div className="rounded-lg border border-muted-foreground/20 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="size-3.5 text-primary shrink-0" />
                      <span className="font-medium">Planner document</span>
                    </div>
                    <Select value={offer.plannerDocId} onValueChange={(v) => void applyPlannerDoc(offer.uid, v)}>
                      <SelectTrigger className="h-8 text-xs w-full"><SelectValue placeholder="Select planner…" /></SelectTrigger>
                      <SelectContent>
                        {hasPlannerDraft && <SelectItem value="draft">Planner draft (local)</SelectItem>}
                        {savedPlanners.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {offer.plannerLabel && (
                      <p className="text-xs text-primary">✓ Expenses from <span className="font-semibold">{offer.plannerLabel}</span></p>
                    )}
                  </div>
                )}

                {!hasConfigOptions && !hasPlannerOptions && (
                  <p className="text-xs text-muted-foreground">
                    <Link href="/calculator" className="text-primary hover:underline">Set up a paycheck config →</Link>{" "}
                    to auto-fill net take-home and expenses.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Financial Performance */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Financial Performance</h2>
          <Card className="shadow-none">
            <CardContent className="p-0">
              <div className={`grid ${gridClass} gap-4 px-6 py-4 items-center`}>
                <div>
                  <p className="text-sm font-semibold">Gross Compensation</p>
                  <p className="text-xs text-muted-foreground">e.g. $55/hr, $8500/mo, $120k/yr</p>
                </div>
                {offers.map((o) => (
                  <Input key={o.uid} placeholder="$55/hr" value={o.compensation} onChange={(e) => updateOffer(o.uid, "compensation", e.target.value)} className="h-8 text-sm font-bold" />
                ))}
              </div>
              <Separator />
              <div className={`grid ${gridClass} gap-4 px-6 py-4 items-center`}>
                <div>
                  <p className="text-sm font-semibold">Net Take-home</p>
                  <p className="text-xs text-muted-foreground">Post-tax estimate (or pick a config)</p>
                </div>
                {offers.map((o, i) => (
                  <div key={o.uid} className="space-y-1">
                    <Input placeholder="$0/mo" value={o.netTakeHome} onChange={(e) => updateOffer(o.uid, "netTakeHome", e.target.value)} className="h-8 text-sm font-bold" />
                    {o.paycheckLabel && (
                      <p className="text-[10px] text-muted-foreground truncate">via {o.paycheckLabel}</p>
                    )}
                    {!o.netTakeHome && summaries[i]?.isEstimated && (
                      <p className="text-[10px] text-muted-foreground">≈ {fmtMoney(summaries[i].income)} from hourly</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lifestyle & Logistics */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Lifestyle &amp; Logistics</h2>
          <Card className="shadow-none">
            <CardContent className="p-0">
              <div className={`grid ${gridClass} gap-4 px-6 py-4 items-center`}>
                <div>
                  <p className="text-sm font-semibold">All Expenses</p>
                  <p className="text-xs text-muted-foreground">Monthly total (rent + everything)</p>
                </div>
                {offers.map((o) => (
                  <div key={o.uid} className="space-y-1">
                    <Input placeholder="$0/mo" value={o.allExpenses} onChange={(e) => updateOffer(o.uid, "allExpenses", e.target.value)} className="h-8 text-sm font-bold" />
                    {o.plannerLabel && (
                      <p className="text-[10px] text-muted-foreground truncate">via {o.plannerLabel}</p>
                    )}
                  </div>
                ))}
              </div>
              <Separator />
              <div className={`grid ${gridClass} gap-4 px-6 py-4 items-center`}>
                <div>
                  <p className="text-sm font-semibold">Commute</p>
                  <p className="text-xs text-muted-foreground">Minutes / day</p>
                </div>
                {offers.map((o) => (
                  <div key={o.uid} className="flex items-center gap-1.5">
                    <Input type="number" min={0} placeholder="0" value={o.commute} onChange={(e) => updateOffer(o.uid, "commute", e.target.value)} className="h-8 w-20 text-sm font-bold" />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Leftover — live-computed */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Monthly Leftover</h2>
          <div className={`grid grid-cols-1 gap-6 ${offerGridClass}`}>
            {offers.map((o, i) => {
              const s = summaries[i];
              return (
                <Card key={o.uid} className="shadow-none text-center">
                  <CardContent className="py-8 px-6">
                    <p className="text-sm text-muted-foreground mb-1">
                      {o.company || `Option ${String.fromCharCode(65 + i)}`}
                    </p>
                    <p data-testid={`leftover-${i}`} className="text-3xl font-extrabold tracking-tight">
                      {s?.leftover !== null && s?.leftover !== undefined
                        ? fmtMoney(s.leftover)
                        : "—"}
                    </p>
                    {s?.rate !== null && s?.rate !== undefined && (
                      <Badge data-testid={`rate-${i}`} variant="outline" className="mt-3 text-xs">
                        {s.rate}% savings rate
                      </Badge>
                    )}
                    {s?.isEstimated && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        (estimated from hourly rate)
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
      </LockedPaycheckSection>
    </div>
  );
}
