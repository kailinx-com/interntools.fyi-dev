"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { UserPlus, UserMinus, Users, UserCheck, Calendar } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatSavedItemTimestamp } from "@/lib/paycheck/api";
import {
  fetchPublicProfile,
  fetchPublicProfileByUsername,
  fetchUserPosts,
  fetchFollowers,
  fetchFollowing,
  followUser,
  unfollowUser,
  type PublicUserProfile,
  type FollowSummary,
} from "@/lib/profile/api";
import type { PostSummary } from "@/lib/offers/api";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function PublicProfilePage() {
  const params = useParams<{ profileId: string }>();
  const profileParam = params.profileId ?? "";
  const isNumericId = /^\d+$/.test(profileParam);

  const { user, token, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [followers, setFollowers] = useState<FollowSummary[]>([]);
  const [following, setFollowing] = useState<FollowSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);

  const isOwnProfile =
    isAuthenticated && user && profile != null && profile.id === Number(user.id);

  const loadProfile = useCallback(async () => {
    setIsLoadingData(true);
    setLoadError(null);
    try {
      let pub: PublicUserProfile;
      let numericId: number;

      if (isNumericId) {
        numericId = Number(profileParam);
        pub = await fetchPublicProfile(numericId, token ?? undefined);
      } else {
        pub = await fetchPublicProfileByUsername(profileParam, token ?? undefined);
        numericId = pub.id;
      }

      const [userPosts, followerList, followingList] = await Promise.all([
        fetchUserPosts(numericId, token ?? undefined),
        fetchFollowers(numericId),
        fetchFollowing(numericId),
      ]);
      setProfile(pub);
      setPosts(userPosts);
      setFollowers(followerList);
      setFollowing(followingList);
    } catch (e) {
      setLoadError(getErrorMessage(e));
    } finally {
      setIsLoadingData(false);
    }
  }, [profileParam, isNumericId, token]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleFollow() {
    if (!token || !profile) return;
    setIsFollowLoading(true);
    setFollowError(null);
    try {
      if (profile.followedByViewer) {
        await unfollowUser(token, profile.id);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                followedByViewer: false,
                followerCount: Math.max(0, prev.followerCount - 1),
              }
            : prev,
        );
        setFollowers((prev) => prev.filter((f) => f.id !== Number(user?.id)));
      } else {
        await followUser(token, profile.id);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                followedByViewer: true,
                followerCount: prev.followerCount + 1,
              }
            : prev,
        );
        if (user) {
          setFollowers((prev) => [
            {
              id: Number(user.id),
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
            },
            ...prev,
          ]);
        }
      }
    } catch (e) {
      setFollowError(getErrorMessage(e));
    } finally {
      setIsFollowLoading(false);
    }
  }

  if (isLoadingData) {
    return (
      <PageShell>
        <div className="flex min-h-[40vh] items-center justify-center p-8">
          <Spinner className="size-8" />
        </div>
      </PageShell>
    );
  }

  if (loadError || !profile) {
    return (
      <PageShell>
        <div className="mx-auto max-w-4xl p-4 md:p-8">
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">
                {loadError ?? "Profile not found"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => void loadProfile()}>Try again</Button>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-8 p-4 pb-16 md:p-8">
        {}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                @{profile.username}
              </h1>
              <Badge variant="secondary">{profile.username}</Badge>
            </div>
            <p className="text-lg text-muted-foreground">
              {profile.firstName} {profile.lastName}
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="size-3.5" />
              <span>
                Member since {new Date(profile.createdAt).getFullYear()}
              </span>
            </div>
            <div className="flex gap-6 pt-1 text-sm">
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
          </div>

          <div className="flex flex-col gap-2">
            {isOwnProfile ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/profile">Edit your profile</Link>
              </Button>
            ) : isAuthenticated ? (
              <>
                <Button
                  size="sm"
                  variant={profile.followedByViewer ? "outline" : "default"}
                  disabled={isFollowLoading}
                  onClick={() => void handleFollow()}
                >
                  {isFollowLoading ? (
                    <Spinner className="mr-2 size-4" />
                  ) : profile.followedByViewer ? (
                    <UserMinus className="mr-1.5 size-4" />
                  ) : (
                    <UserPlus className="mr-1.5 size-4" />
                  )}
                  {profile.followedByViewer ? "Unfollow" : "Follow"}
                </Button>
                {followError && (
                  <p className="text-xs text-destructive">{followError}</p>
                )}
              </>
            ) : null}
          </div>
        </div>

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
              Not following anyone yet.
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
            <p className="text-muted-foreground text-sm">No followers yet.</p>
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
          <h2 className="mb-3 text-lg font-semibold">
            Posts
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              ({posts.length})
            </span>
          </h2>
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No public posts yet.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {posts.map((p) => (
                <li key={p.id} className="p-4">
                  <Link
                    href={`/offers/${p.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {p.title}
                  </Link>
                  <p className="text-muted-foreground text-sm">
                    {p.type}
                    {p.publishedAt
                      ? ` · ${formatSavedItemTimestamp(p.publishedAt)}`
                      : ""}
                  </p>
                  {p.type !== "comparison" && p.officeLocation?.trim() ? (
                    <p className="text-muted-foreground text-xs">
                      {p.officeLocation}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}
