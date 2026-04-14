"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, FileText, GitCompare, Users } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchOffers, fetchMyPosts, fetchBookmarkedPosts } from "@/lib/offers/api";
import { fetchOwnProfile } from "@/lib/profile/api";
import { StatsBar } from "./StatsBar";

type UserData = {
  username: string;
  offerCount: number;
  postCount: number;
  bookmarkCount: number;
  followerCount: number;
};

const quickLinks = [
  { label: "My Offers",    href: "/me",       icon: GitCompare },
  { label: "My Posts",     href: "/me",       icon: FileText   },
  { label: "Bookmarks",    href: "/me",       icon: Bookmark   },
  { label: "My Profile",   href: "/profile",  icon: Users      },
];

function WelcomeBanner({ data }: { data: UserData }) {
  const tiles = [
    { value: data.offerCount,    label: "Saved offers"    },
    { value: data.postCount,     label: "Posts published" },
    { value: data.bookmarkCount, label: "Bookmarks"       },
    { value: data.followerCount, label: "Followers"       },
  ];

  return (
    <section className="border-y border-border bg-primary/5 dark:bg-primary/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-0.5">
              Welcome back
            </p>
            <h2 className="text-xl font-bold text-foreground">
              {data.username}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="inline-flex items-center gap-1.5 text-xs font-medium border border-border bg-card hover:bg-accent px-3 py-1.5 rounded-lg transition-colors"
              >
                <Icon className="size-3.5 text-primary" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tiles.map(({ value, label }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card px-4 py-4 text-center shadow-xs"
            >
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WelcomeBannerSkeleton() {
  return (
    <section className="border-y border-border bg-primary/5 dark:bg-primary/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map(({ label }) => (
              <div key={label} className="h-7 w-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card px-4 py-4 text-center">
              <div className="h-7 w-10 mx-auto rounded bg-muted animate-pulse mb-2" />
              <div className="h-3 w-16 mx-auto rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeStatsBar() {
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !token) return;

    setFetching(true);
    Promise.all([
      fetchOffers(token),
      fetchMyPosts(token),
      fetchBookmarkedPosts(token),
      fetchOwnProfile(token),
    ])
      .then(([offers, posts, bookmarks, profile]) => {
        setUserData({
          username: user?.username ?? profile.username,
          offerCount: offers.length,
          postCount: posts.length,
          bookmarkCount: bookmarks.length,
          followerCount: profile.followerCount,
        });
      })
      .catch(() => setUserData(null))
      .finally(() => setFetching(false));
  }, [isLoading, isAuthenticated, token, user]);

  if (isLoading || fetching) {
    return isAuthenticated ? <WelcomeBannerSkeleton /> : <StatsBar />;
  }

  if (isAuthenticated && userData) {
    return <WelcomeBanner data={userData} />;
  }

  return <StatsBar />;
}
