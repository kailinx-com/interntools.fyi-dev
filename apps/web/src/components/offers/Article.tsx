"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, BarChart2, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { bookmarkPost, unbookmarkPost, type PostSummary } from "@/lib/offers/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState } from "react";

type OfferSnapshot = {
  company?: string;
  role?: string;
  compensation?: string;
  label?: string;
};

function parseSnapshots(raw: string | null | undefined): OfferSnapshot[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function initials(username: string): string {
  return username
    .replace(/^@/, "")
    .slice(0, 2)
    .toUpperCase();
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const ms = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export type ArticleProps = {
  post: PostSummary;
  offerSnapshots?: string | null;
};

export function Article({ post, offerSnapshots }: ArticleProps) {
  const snapshots = parseSnapshots(offerSnapshots);
  const { token } = useAuth();
  const [bookmarked, setBookmarked] = useState(post.bookmarked);

  async function toggleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    if (!token) return;
    setBookmarked((prev) => !prev);
    try {
      if (bookmarked) await unbookmarkPost(token, post.id);
      else await bookmarkPost(token, post.id);
    } catch {
      setBookmarked((prev) => !prev); // revert on error
    }
  }

  return (
    <Link href={`/offers/${post.id}`} className="block group">
    <Card className="rounded-2xl shadow-none transition-all group-hover:ring-1 group-hover:ring-primary/20 group-hover:shadow-sm">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary" className="text-[10px] uppercase tracking-widest">
                {post.type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {relativeTime(post.publishedAt ?? post.createdAt)}
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
              {post.title}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">@{post.authorUsername}</p>
            </div>
            <Avatar>
              <AvatarFallback>{initials(post.authorUsername)}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {snapshots.length === 1 && (() => {
          const snap = snapshots[0];
          const isRejection = snap.label?.toLowerCase() === "rejection";
          return (
            <div className={cn(
              "flex items-center justify-between p-5 rounded-xl border mb-8 gap-4",
              isRejection
                ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900"
                : "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900",
            )}>
              <div className="space-y-0.5">
                <p className={cn(
                  "text-xs font-semibold uppercase tracking-widest",
                  isRejection ? "text-red-500" : "text-emerald-600 dark:text-emerald-400",
                )}>
                  {snap.label ?? "Acceptance"}
                </p>
                <h4 className="text-lg font-bold">{snap.company ?? "—"}</h4>
                {snap.role && <p className="text-sm text-muted-foreground">{snap.role}</p>}
              </div>
              {snap.compensation && (
                <Badge variant="outline" className={cn(
                  "text-sm font-bold shrink-0",
                  isRejection
                    ? "border-red-300 text-red-600 dark:border-red-700 dark:text-red-400"
                    : "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400",
                )}>
                  {snap.compensation}
                </Badge>
              )}
            </div>
          );
        })()}

        {snapshots.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {snapshots.map((snap, i) => (
              <div
                key={i}
                className="relative p-6 rounded-xl bg-muted border transition-all hover:border-primary/20"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {snap.label ?? `Option ${String.fromCharCode(65 + i)}`}
                    </p>
                    <h4 className="text-lg font-bold">{snap.company ?? "—"}</h4>
                    <p className="text-sm text-muted-foreground">{snap.role ?? ""}</p>
                  </div>
                  {snap.compensation && (
                    <Badge variant="outline" className="text-xs font-bold">
                      {snap.compensation}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator className="mb-4" />

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-2 pointer-events-none">
            <MessageCircle className="size-4" />
            Comments
          </Button>
          {post.type === "comparison" && (
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-2 pointer-events-none">
              <BarChart2 className="size-4" />
              Vote
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("ml-auto relative z-10", bookmarked ? "text-primary" : "text-muted-foreground hover:text-primary")}
            onClick={(e) => void toggleBookmark(e)}
          >
            <Bookmark className={cn("size-4", bookmarked && "fill-current")} />
          </Button>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}
