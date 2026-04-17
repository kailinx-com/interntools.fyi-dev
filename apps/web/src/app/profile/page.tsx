"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Pencil, Users, UserCheck } from "lucide-react";
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
import {
  fetchBookmarkedPosts,
  fetchMyPosts,
  type PostSummary,
} from "@/lib/offers/api";
import { formatSavedItemTimestamp } from "@/lib/paycheck/api";
import {
  fetchOwnProfile,
  fetchFollowers,
  fetchFollowing,
  type OwnUserProfile,
  type FollowSummary,
} from "@/lib/profile/api";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading, updateUser } = useAuth();

  const [profile, setProfile] = useState<OwnUserProfile | null>(null);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [bookmarks, setBookmarks] = useState<PostSummary[]>([]);
  const [following, setFollowing] = useState<FollowSummary[]>([]);
  const [followers, setFollowers] = useState<FollowSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
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
      router.replace("/login?redirect=/profile");
    }
  }, [isAuthenticated, isLoading, router, token]);

  const loadProfile = useCallback(async () => {
    if (!token || !user) return;
    setIsLoadingData(true);
    setLoadError(null);
    try {
      const userId = Number(user.id);
      const [ownProfile, myPosts, myBookmarks, myFollowing, myFollowers] =
        await Promise.all([
          fetchOwnProfile(token),
          fetchMyPosts(token),
          fetchBookmarkedPosts(token),
          fetchFollowing(userId),
          fetchFollowers(userId),
        ]);
      setProfile(ownProfile);
      setPosts(myPosts);
      setBookmarks(myBookmarks);
      setFollowing(myFollowing);
      setFollowers(myFollowers);
    } catch (e) {
      setLoadError(getErrorMessage(e));
    } finally {
      setIsLoadingData(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (!isAuthenticated || !token || !user) return;
    void loadProfile();
  }, [isAuthenticated, token, user, loadProfile]);

  function openProfileEdit() {
    setEditFirstName(profile?.firstName ?? user?.firstName ?? "");
    setEditLastName(profile?.lastName ?? user?.lastName ?? "");
    setEditUsername(user?.username ?? "");
    setEditEmail(user?.email ?? "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setProfileError(null);
    setProfileSuccess(false);
    setIsEditingProfile(true);
  }

  async function doProfileSave() {
    if (!token || !user) return;
    setProfileSaving(true);
    try {
      const changingUsername =
        editUsername !== user.username && editUsername.trim() !== "";
      const changingEmail = editEmail !== user.email && editEmail.trim() !== "";
      const changingPassword = newPassword.trim() !== "";

      const updatedUser = await updateProfile(token, {
        username: changingUsername ? editUsername : undefined,
        email: changingEmail ? editEmail : undefined,
        currentPassword: currentPassword || undefined,
        newPassword: changingPassword ? newPassword : undefined,
        firstName:
          editFirstName !== profile?.firstName ? editFirstName : undefined,
        lastName:
          editLastName !== profile?.lastName ? editLastName : undefined,
      });
      updateUser(updatedUser);
      setProfileSuccess(true);
      setIsEditingProfile(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      void loadProfile();
    } catch (e) {
      setProfileError(
        e instanceof Error ? e.message : "Failed to update profile.",
      );
    } finally {
      setProfileSaving(false);
    }
  }

  function handleProfileSave() {
    if (!token || !user) return;
    setProfileError(null);

    if (newPassword && newPassword !== confirmPassword) {
      setProfileError("New passwords do not match.");
      return;
    }
    if (newPassword && !currentPassword) {
      setProfileError("Current password is required to set a new password.");
      return;
    }

    const changingUsername =
      editUsername !== user.username && editUsername.trim() !== "";
    const changingEmail =
      editEmail !== user.email && editEmail.trim() !== "";

    if ((changingUsername || changingEmail) && !currentPassword) {
      setProfileError(
        "Current password is required to change your username or email.",
      );
      return;
    }

    if (changingUsername || changingEmail) {
      const lines: string[] = [];
      if (changingUsername)
        lines.push(`Username: "${user.username}" → "${editUsername}"`);
      if (changingEmail)
        lines.push(`Email: "${user.email}" → "${editEmail}"`);
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

  if (!user || !token) return null;

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-8 p-4 pb-16 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Your public profile and personal information.
            </p>
          </div>
          {profile && (
            <div className="text-muted-foreground flex gap-6 text-sm">
              <span>
                <span className="font-semibold text-foreground">
                  {profile.followerCount}
                </span>{" "}
                followers
              </span>
              <span>
                <span className="font-semibold text-foreground">
                  {profile.followingCount}
                </span>{" "}
                following
              </span>
            </div>
          )}
        </div>

        {}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Personal information</CardTitle>
              <CardDescription>
                Manage your account details and password.
              </CardDescription>
            </div>
            {!isEditingProfile && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={openProfileEdit}
              >
                <Pencil className="mr-1.5 size-3.5" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {!isEditingProfile ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">First name</span>
                  <p className="font-medium">
                    {profile?.firstName ?? user.firstName}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last name</span>
                  <p className="font-medium">
                    {profile?.lastName ?? user.lastName}
                  </p>
                </div>
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
                {profile && (
                  <div>
                    <span className="text-muted-foreground">Member since</span>
                    <p className="font-medium">
                      {new Date(profile.createdAt).getFullYear()}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-firstName">First name</Label>
                    <Input
                      id="edit-firstName"
                      placeholder="First name"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-lastName">Last name</Label>
                    <Input
                      id="edit-lastName"
                      placeholder="Last name"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                {}
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Account credentials
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Changing username or email requires your current password.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-username">Username</Label>
                    <Input
                      id="edit-username"
                      placeholder="Username"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      placeholder="Email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                {}
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Change password
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Leave blank to keep current password.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Required to change"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
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
                    {profileSaving && <Spinner className="mr-2 size-4" />}
                    Save changes
                  </Button>
                  <Button
                    variant="outline"
                    disabled={profileSaving}
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {profileSuccess && !isEditingProfile && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Profile updated successfully.
              </p>
            )}
          </CardContent>
        </Card>

        {loadError && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">
                Could not load profile data
              </CardTitle>
              <CardDescription>{loadError}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" onClick={() => void loadProfile()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoadingData && !profile && !loadError && (
          <div className="flex justify-center py-12">
            <Spinner className="size-8" />
          </div>
        )}

        {profile && (
          <div className="space-y-8">
            {}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <Users className="size-5" />
                Following
                <span className="text-muted-foreground text-sm font-normal">
                  ({following.length})
                </span>
              </h2>
              {following.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Not following anyone yet. Browse profiles to follow users.
                </p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {following.map((f) => (
                    <li key={f.id} className="p-4">
                      <Link
                        href={`/profile/${f.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        @{f.username}
                      </Link>
                      <p className="text-muted-foreground text-sm">
                        {f.firstName} {f.lastName}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <UserCheck className="size-5" />
                Followers
                <span className="text-muted-foreground text-sm font-normal">
                  ({followers.length})
                </span>
              </h2>
              {followers.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No followers yet.
                </p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {followers.map((f) => (
                    <li key={f.id} className="p-4">
                      <Link
                        href={`/profile/${f.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        @{f.username}
                      </Link>
                      <p className="text-muted-foreground text-sm">
                        {f.firstName} {f.lastName}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {}
            <section>
              <h2 className="mb-3 text-lg font-semibold">My posts</h2>
              {posts.length === 0 ? (
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
                  {posts.map((p) => (
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
                          <p className="text-muted-foreground text-xs">
                            {p.officeLocation}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {}
            <section>
              <h2 className="mb-3 text-lg font-semibold">Bookmarks</h2>
              {bookmarks.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No bookmarks yet.{" "}
                  <Link
                    href="/offers"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Browse the feed
                  </Link>
                  .
                </p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {bookmarks.map((p) => (
                    <li key={p.id} className="p-4">
                      <Link
                        href={`/offers/${p.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {p.title}
                      </Link>
                      <p className="text-muted-foreground text-sm">
                        {p.type} ·{" "}
                        <Link
                          href={`/profile/${p.authorUsername}`}
                          className="hover:underline"
                        >
                          @{p.authorUsername}
                        </Link>
                        {p.publishedAt
                          ? ` · ${formatSavedItemTimestamp(p.publishedAt)}`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!confirmDialog}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog(null);
        }}
      >
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
