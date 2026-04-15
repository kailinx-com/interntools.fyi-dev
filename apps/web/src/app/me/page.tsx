"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftRight,
  BookOpen,
  Calculator,
  FileText,
  Pencil,
  Shield,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { updateProfile } from "@/lib/auth/api";
import { ADMIN_DASHBOARD_PATH, isAdminRole } from "@/lib/auth/roleUi";
import {
  deleteComparison,
  deleteOffer,
  deletePost,
  fetchBookmarkedPosts,
  fetchComparisons,
  fetchMyPosts,
  fetchOffers,
  unbookmarkPost,
  type Comparison,
  type Offer,
  type PostSummary,
} from "@/lib/offers/api";
import {
  deleteCalculatorConfig,
  deletePlannerDocument,
  formatSavedItemTimestamp,
  listCalculatorConfigs,
  listPlannerDocuments,
  type SavedCalculatorConfigSummary,
  type SavedPlannerDocumentSummary,
} from "@/lib/paycheck/api";

type DashboardData = {
  offers: Offer[];
  comparisons: Comparison[];
  posts: PostSummary[];
  bookmarks: PostSummary[];
  scenarios: SavedCalculatorConfigSummary[];
  planners: SavedPlannerDocumentSummary[];
};

const employmentLabel: Record<string, string> = {
  internship: "Internship",
  coop: "Co-op",
  full_time: "Full-time",
};

const compensationLabel: Record<string, string> = {
  hourly: "Hourly",
  monthly: "Monthly",
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function MePage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading, logout, updateUser } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dashboardActionError, setDashboardActionError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileUsername, setProfileUsername] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    lines: string[];
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !token) {
      router.replace("/login?redirect=/me");
    }
  }, [isAuthenticated, isLoading, router, token]);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setIsLoadingData(true);
    setLoadError(null);
    setDashboardActionError(null);
    try {
      const [allOffers, comparisons, posts, bookmarks, scenarios, planners] = await Promise.all([
        fetchOffers(token),
        fetchComparisons(token),
        fetchMyPosts(token),
        fetchBookmarkedPosts(token),
        listCalculatorConfigs(token),
        listPlannerDocuments(token).catch(() => [] as SavedPlannerDocumentSummary[]),
      ]);
      setData({ offers: allOffers, comparisons, posts, bookmarks, scenarios, planners });
    } catch (e) {
      setLoadError(getErrorMessage(e));
      setData(null);
    } finally {
      setIsLoadingData(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    void loadDashboard();
  }, [isAuthenticated, token, loadDashboard]);

  async function handleDelete(
    kind: "offer" | "comparison" | "post" | "bookmark" | "scenario" | "planner",
    id: number | string,
  ) {
    if (!token || !window.confirm("Delete this item?")) return;
    const key = `${kind}-${id}`;
    setDeletingId(key);
    setDashboardActionError(null);
    try {
      switch (kind) {
        case "offer":
          await deleteOffer(token, id as number);
          break;
        case "comparison":
          await deleteComparison(token, id as number);
          break;
        case "post":
          await deletePost(token, id as number);
          break;
        case "bookmark":
          await unbookmarkPost(token, id as number);
          break;
        case "scenario":
          await deleteCalculatorConfig(token, id as number);
          break;
        case "planner":
          await deletePlannerDocument(token, id as string);
          break;
      }
      await loadDashboard();
    } catch (e) {
      setDashboardActionError(getErrorMessage(e));
    } finally {
      setDeletingId(null);
    }
  }

  function openProfileEdit() {
    setProfileUsername(user?.username ?? "");
    setProfileEmail(user?.email ?? "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setProfileError(null);
    setProfileSuccess(false);
    setIsEditingProfile(true);
  }

  async function doProfileSave() {
    if (!token) return;
    setProfileSaving(true);
    try {
      const updatedUser = await updateProfile(token, {
        username: profileUsername !== user?.username ? profileUsername : undefined,
        email: profileEmail !== user?.email ? profileEmail : undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      updateUser(updatedUser);
      setProfileSuccess(true);
      setIsEditingProfile(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  function handleProfileSave() {
    if (!token) return;
    setProfileError(null);

    if (newPassword && newPassword !== confirmPassword) {
      setProfileError("New passwords do not match.");
      return;
    }
    if (newPassword && !currentPassword) {
      setProfileError("Current password is required to set a new password.");
      return;
    }

    const changingUsername = profileUsername !== user?.username && profileUsername.trim() !== "";
    const changingEmail = profileEmail !== user?.email && profileEmail.trim() !== "";

    if ((changingUsername || changingEmail) && !currentPassword) {
      setProfileError("Current password is required to change your username or email.");
      return;
    }

    if (changingUsername || changingEmail) {
      const lines: string[] = [];
      if (changingUsername) lines.push(`Username: "${user?.username}" → "${profileUsername}"`);
      if (changingEmail) lines.push(`Email: "${user?.email}" → "${profileEmail}"`);
      setConfirmDialog({ lines, onConfirm: () => void doProfileSave() });
      return;
    }

    void doProfileSave();
  }

  if (isLoading || (!isAuthenticated && !token)) {
    return (
      <PageShell>
        <div className="flex min-h-[40vh] items-center justify-center p-8">
          <Spinner className="size-8" />
        </div>
      </PageShell>
    );
  }

  if (!user || !token) {
    return null;
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-8 p-4 pb-16 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My account</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Profile and everything you have saved on interntools.fyi.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdminRole(user.role) ? (
              <Button variant="secondary" size="sm" asChild>
                <Link href={ADMIN_DASHBOARD_PATH}>
                  <Shield className="size-3.5 mr-1.5" aria-hidden />
                  Admin console
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" size="sm" asChild>
              <Link href="/offers/compare">Compare offers</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void logout().then(() => router.push("/"))}
            >
              Log out
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your account details and password.</CardDescription>
            </div>
            {!isEditingProfile && (
              <Button variant="outline" size="sm" className="shrink-0" onClick={openProfileEdit}>
                <Pencil className="size-3.5 mr-1.5" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {!isEditingProfile ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Username</span>
                  <p className="font-medium">{user.username}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Role</span>
                  <p className="font-medium">{user.role}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-username">Username</Label>
                    <Input
                      id="profile-username"
                      placeholder="your-username"
                      value={profileUsername}
                      onChange={(e) => setProfileUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      placeholder="you@example.com"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Change Password
                  </p>
                  <p className="text-xs text-muted-foreground">Leave blank to keep current password.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Required to change"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                {profileError && (
                  <p className="text-sm text-destructive">{profileError}</p>
                )}

                <div className="flex gap-3">
                  <Button disabled={profileSaving} onClick={handleProfileSave}>
                    {profileSaving && <Spinner className="size-4 mr-2" />}
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    disabled={profileSaving}
                    onClick={() => { setIsEditingProfile(false); setProfileError(null); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {profileSuccess && !isEditingProfile && (
              <p className="text-sm text-green-600 dark:text-green-400">Profile updated successfully.</p>
            )}
          </CardContent>
        </Card>

        {loadError ? (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Could not load saved data</CardTitle>
              <CardDescription>{loadError}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" onClick={() => void loadDashboard()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {dashboardActionError && !loadError ? (
          <p className="text-sm text-destructive" role="alert">
            {dashboardActionError}
          </p>
        ) : null}

        {isLoadingData && !data && !loadError ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-8" />
          </div>
        ) : null}

        {isLoadingData && data ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Spinner className="size-4" />
            Refreshing saved data…
          </div>
        ) : null}

        {data ? (
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-lg font-semibold">Saved offers</h2>
              {data.offers.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No saved offers yet. Create and save offers from{" "}
                  <Link
                    href="/offers/compare"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Compare offers
                  </Link>
                  .
                </p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {data.offers.map((o) => (
                    <li
                      key={o.id}
                      className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          {o.company} — {o.title}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {o.employmentType != null
                            ? employmentLabel[o.employmentType] ?? o.employmentType
                            : "—"}{" "}
                          ·{" "}
                          {o.compensationType != null
                            ? compensationLabel[o.compensationType] ?? o.compensationType
                            : "—"}{" "}
                          · {o.officeLocation}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <p className="text-muted-foreground shrink-0 text-xs mr-2">
                          Updated {formatSavedItemTimestamp(o.updatedAt)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground"
                          title="View saved offer"
                          asChild
                        >
                          <Link href={`/offers/saved/${o.id}`}>
                            <FileText className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === `offer-${o.id}`}
                          onClick={() => void handleDelete("offer", o.id)}
                        >
                          {deletingId === `offer-${o.id}` ? (
                            <Spinner className="size-4" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">Saved comparisons</h2>
              {data.comparisons.length === 0 ? (
                <p className="text-muted-foreground text-sm">No saved comparisons yet.</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {data.comparisons.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{c.name}</p>
                        {c.includedOfferIds.length > 0 ? (
                          <p className="text-muted-foreground text-sm">
                            Offers: {c.includedOfferIds.join(", ")}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                        <p className="text-muted-foreground shrink-0 text-xs mr-2">
                          {formatSavedItemTimestamp(c.updatedAt)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground"
                          title="Open comparison"
                          asChild
                        >
                          <Link
                            href={`/offers/compare?comparison=${c.id}`}
                            aria-label="Open comparison"
                          >
                            <ArrowLeftRight className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === `comparison-${c.id}`}
                          onClick={() => void handleDelete("comparison", c.id)}
                          title="Delete comparison"
                        >
                          {deletingId === `comparison-${c.id}` ? (
                            <Spinner className="size-4" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">My posts</h2>
              {data.posts.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No posts yet.{" "}
                  <Link
                    href="/offers/submit"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Post an update
                  </Link>
                  .
                </p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {data.posts.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <Link
                          href={`/offers/${p.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {p.title}
                        </Link>
                        <p className="text-muted-foreground text-sm">
                          {p.type} · {p.status}
                          {p.publishedAt
                            ? ` · ${formatSavedItemTimestamp(p.publishedAt)}`
                            : ""}
                        </p>
                        {p.type !== "comparison" && p.officeLocation?.trim() ? (
                          <p className="text-muted-foreground text-xs">{p.officeLocation}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground"
                          title="Edit post"
                          asChild
                        >
                          <Link href={`/offers/${p.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === `post-${p.id}`}
                          onClick={() => void handleDelete("post", p.id)}
                        >
                          {deletingId === `post-${p.id}` ? (
                            <Spinner className="size-4" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">Bookmarked posts</h2>
              {data.bookmarks.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No bookmarks yet.{" "}
                  <Link href="/offers" className="text-primary underline-offset-4 hover:underline">
                    Browse the feed
                  </Link>
                  .
                </p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {data.bookmarks.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <Link
                          href={`/offers/${p.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {p.title}
                        </Link>
                        <p className="text-muted-foreground text-sm">
                          {p.type} · @{p.authorUsername}
                          {p.publishedAt ? ` · ${formatSavedItemTimestamp(p.publishedAt)}` : ""}
                        </p>
                        {p.type !== "comparison" && p.officeLocation?.trim() ? (
                          <p className="text-muted-foreground text-xs">{p.officeLocation}</p>
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                        title="Remove bookmark"
                        onClick={() => void handleDelete("bookmark", p.id)}
                        disabled={deletingId === `bookmark-${p.id}`}
                      >
                        {deletingId === `bookmark-${p.id}` ? (
                          <Spinner className="size-4" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">Paycheck scenarios</h2>
              {data.scenarios.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  None saved.{" "}
                  <Link
                    href="/calculator"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Open the calculator
                  </Link>
                  .
                </p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {data.scenarios.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p className="font-medium">{s.name}</p>
                      <div className="flex items-center gap-1">
                        <p className="text-muted-foreground shrink-0 text-xs mr-2">
                          {formatSavedItemTimestamp(s.createdAt)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground"
                          title="Open in Calculator"
                          asChild
                        >
                          <Link href={`/calculator?scenario=${s.id}`}>
                            <Calculator className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === `scenario-${s.id}`}
                          onClick={() => void handleDelete("scenario", s.id)}
                        >
                          {deletingId === `scenario-${s.id}` ? (
                            <Spinner className="size-4" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">Planner documents</h2>
              {data.planners.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  None saved.{" "}
                  <Link
                    href="/calculator/planner"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Open the planner
                  </Link>
                  .
                </p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {data.planners.map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p className="font-medium">{d.name}</p>
                      <div className="flex items-center gap-1">
                        <p className="text-muted-foreground shrink-0 text-xs mr-2">
                          {formatSavedItemTimestamp(d.createdAt)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground"
                          title="Open in Planner"
                          asChild
                        >
                          <Link href={`/calculator/planner?planner=${d.id}`}>
                            <BookOpen className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === `planner-${d.id}`}
                          onClick={() => void handleDelete("planner", d.id)}
                        >
                          {deletingId === `planner-${d.id}` ? (
                            <Spinner className="size-4" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </div>
      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => { if (!open) setConfirmDialog(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm changes</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1">
                <p>You are about to make the following changes:</p>
                <ul className="mt-2 space-y-0.5 text-sm font-medium text-foreground">
                  {confirmDialog?.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="mt-2">Are you sure you want to continue?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmDialog?.onConfirm();
                setConfirmDialog(null);
              }}
            >
              Yes, save changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
