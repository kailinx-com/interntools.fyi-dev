"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, BarChart2, Bookmark } from "lucide-react";
import { type PostSummary } from "@/lib/offers/api";

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

  return (
    <Card className="rounded-2xl shadow-none transition-all hover:ring-1 ring-outline-variant/20">
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
            <Link href={`/offers/${post.id}`}>
              <h2 className="text-2xl font-bold tracking-tight hover:text-primary transition-colors">
                {post.title}
              </h2>
            </Link>
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

        {snapshots.length > 0 && (
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
          <Link href={`/offers/${post.id}`}>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-2">
              <MessageCircle className="size-4" />
              Comments
            </Button>
          </Link>
          <Link href={`/offers/${post.id}`}>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-2">
              <BarChart2 className="size-4" />
              Vote
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="ml-auto text-muted-foreground hover:text-primary">
            <Bookmark className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
