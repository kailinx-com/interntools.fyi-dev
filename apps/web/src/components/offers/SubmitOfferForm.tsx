"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Plus, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getCompareOffersDraft,
  clearCompareOffersDraft,
  type CompareOffersDraftEntry,
} from "@/lib/offers";
import { createPost } from "@/lib/offers/api";

const POST_TYPES = ["Acceptance", "Rejection", "Comparison"] as const;
type PostTypeOption = (typeof POST_TYPES)[number];

type CompanyRow = { company: string; role: string; compensation: string };

const emptyCompanyPair: CompanyRow[] = [
  { company: "", role: "", compensation: "" },
  { company: "", role: "", compensation: "" },
];

function postTypeToApi(type: PostTypeOption): "acceptance" | "comparison" {
  return type === "Comparison" ? "comparison" : "acceptance";
}

export function SubmitOfferForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const fromCompare = searchParams.get("from") === "compare";

  const [title, setTitle] = useState("");
  const [postType, setPostType] = useState<PostTypeOption>(() =>
    fromCompare ? "Comparison" : "Acceptance",
  );
  const [companies, setCompanies] = useState<CompanyRow[]>(() => {
    if (!fromCompare) return [...emptyCompanyPair];
    const draft = getCompareOffersDraft();
    if (!draft?.offers.length) return [...emptyCompanyPair];
    return draft.offers.map((o) => ({
      company: o.company,
      role: o.role,
      compensation: o.compensation,
    }));
  });
  const [singleCompany, setSingleCompany] = useState("");
  const [singleRole, setSingleRole] = useState("");
  const [compensation, setCompensation] = useState("");
  const [notes, setNotes] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [compareDraft] = useState<CompareOffersDraftEntry[] | null>(() => {
    if (!fromCompare) return null;
    const draft = getCompareOffersDraft();
    return draft ? draft.offers : null;
  });

  useEffect(() => {
    if (fromCompare && getCompareOffersDraft()) clearCompareOffersDraft();
  }, [fromCompare]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login?redirect=/offers/submit");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  function addCompany() {
    setCompanies((prev) => [
      ...prev,
      { company: "", role: "", compensation: "" },
    ]);
  }

  function removeCompany(idx: number) {
    if (companies.length <= 2) return;
    setCompanies((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateCompany(idx: number, field: keyof CompanyRow, value: string) {
    setCompanies((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );
  }

  function buildPayload(): { type: "acceptance" | "comparison"; title: string; body: string | null; offerSnapshots: string } | null {
    if (!title.trim()) {
      setSubmitError("Title is required.");
      return null;
    }

    if (postType === "Comparison") {
      const validOffers = companies.filter((r) => r.company.trim());
      if (validOffers.length < 2) {
        setSubmitError("At least 2 offers are required for a comparison.");
        return null;
      }
      return {
        type: postTypeToApi(postType),
        title: title.trim(),
        body: notes.trim() || null,
        offerSnapshots: JSON.stringify(
          validOffers.map((r, i) => ({
            label: `Option ${String.fromCharCode(65 + i)}`,
            company: r.company.trim(),
            role: r.role.trim(),
            compensation: r.compensation.trim(),
          })),
        ),
      };
    } else {
      if (!singleCompany.trim()) {
        setSubmitError("Company is required.");
        return null;
      }
      return {
        type: postTypeToApi(postType),
        title: title.trim(),
        body: notes.trim() || null,
        offerSnapshots: JSON.stringify([
          {
            company: singleCompany.trim(),
            role: singleRole.trim(),
            compensation: compensation.trim(),
          },
        ]),
      };
    }
  }

  async function handleSave(status: "draft" | "published") {
    if (!token) return;
    setSubmitError(null);

    const payload = buildPayload();
    if (!payload) return;

    if (status === "published") setIsPublishing(true);
    else setIsSavingDraft(true);

    try {
      const post = await createPost(token, {
        ...payload,
        status,
        visibility: "public_post",
      });
      if (status === "published") {
        router.push(`/offers/${post.id}`);
      } else {
        router.push("/me");
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save post.",
      );
      if (status === "published") setIsPublishing(false);
      else setIsSavingDraft(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void handleSave("published");
  }

  if (isAuthLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="mx-auto max-w-2xl space-y-5 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Post an Update</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Share your internship offer details anonymously with the community.
          </p>
        </div>

        {/* Comparison preview from Compare Offers */}
        {fromCompare && compareDraft && (
          <Card className="shadow-none border-primary/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Comparison Preview
                </p>
                <Badge
                  variant="secondary"
                  className="text-[10px] uppercase tracking-widest"
                >
                  From Compare Offers
                </Badge>
              </div>
              <div className="space-y-2">
                {compareDraft.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-semibold">{o.company}</span>
                    <span className="text-muted-foreground">{o.role}</span>
                    <span className="font-mono text-xs">{o.compensation}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-none">
          <CardContent className="p-5">
            <form className="space-y-5" noValidate onSubmit={(e) => void handleSubmit(e)}>
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Choosing between FAANG and startup for SWE"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Type selector — hidden when from compare */}
              {!fromCompare && (
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Type
                  </Label>
                  <div className="flex gap-2">
                    {POST_TYPES.map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant={postType === type ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "rounded-full",
                          postType === type && "font-bold",
                        )}
                        onClick={() => setPostType(type)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Acceptance / Rejection — simple form */}
              {(postType === "Acceptance" || postType === "Rejection") && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        placeholder="e.g. Google"
                        value={singleCompany}
                        onChange={(e) => setSingleCompany(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        placeholder="e.g. SWE Intern"
                        value={singleRole}
                        onChange={(e) => setSingleRole(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compensation">Compensation</Label>
                    <Input
                      id="compensation"
                      placeholder="e.g. $8,500/mo"
                      value={compensation}
                      onChange={(e) => setCompensation(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Comparison — multi-company rows */}
              {postType === "Comparison" && (
                <>
                  {!fromCompare && (
                    <Card className="shadow-none bg-muted border-0">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                          Want a full breakdown with paycheck data?
                        </p>
                        <Link href="/offers/compare">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 shrink-0"
                          >
                            Build comparison first
                            <ArrowRight className="size-3.5" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Offers
                    </Label>
                    {companies.map((row, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground">
                            Option {String.fromCharCode(65 + idx)}
                          </span>
                          {companies.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-6 text-muted-foreground"
                              onClick={() => removeCompany(idx)}
                            >
                              <X className="size-3.5" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Company"
                            value={row.company}
                            onChange={(e) =>
                              updateCompany(idx, "company", e.target.value)
                            }
                          />
                          <Input
                            placeholder="Role"
                            value={row.role}
                            onChange={(e) =>
                              updateCompany(idx, "role", e.target.value)
                            }
                          />
                          <Input
                            placeholder="e.g. $8,500/mo"
                            value={row.compensation}
                            onChange={(e) =>
                              updateCompany(idx, "compensation", e.target.value)
                            }
                          />
                        </div>
                        {idx < companies.length - 1 && <Separator />}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 mt-1"
                      onClick={addCompany}
                    >
                      <Plus className="size-3.5" />
                      Add another offer
                    </Button>
                  </div>
                </>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Any additional context you'd like to share..."
                  className="resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 font-bold"
                  disabled={isPublishing || isSavingDraft}
                >
                  {isPublishing && <Spinner className="size-4 mr-2" />}
                  Publish
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  disabled={isPublishing || isSavingDraft}
                  onClick={() => void handleSave("draft")}
                >
                  {isSavingDraft && <Spinner className="size-4 mr-2" />}
                  Save Draft
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
