"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CommunityNoteCard } from "./CommunityNoteCard";
import { TrendingCitiesWidget } from "./TrendingCitiesWidget";
import type { CommunityNoteCardProps } from "./CommunityNoteCard";
import { fetchPublishedPosts, fetchPost } from "@/lib/offers/api";
import { cn } from "@/lib/utils";

export interface CommunityNotesSectionProps {
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  notes?: CommunityNoteCardProps[];
  trendingCitiesProps?: React.ComponentProps<typeof TrendingCitiesWidget>;

  className?: string;
}

const fallbackNotes: CommunityNoteCardProps[] = [
  {
    tag: "Location",
    tagVariant: "location",
    meta: "Seattle, WA",
    title: "Capitol Hill vs. SLU for a summer SWE intern",
    excerpt:
      "Compared two sublease options against net pay from the calculator. Shorter commute won even though rent was slightly higher...",
    href: "/offers",
  },
  {
    tag: "Offers",
    tagVariant: "salary",
    meta: "Menlo Park, CA",
    title: "Meta SWE intern offer breakdown (Summer '24)",
    excerpt:
      "Base stipend plus signing bonus — ran both through take-home and rent scenarios to see real monthly leftover...",
    href: "/offers",
  },
  {
    tag: "Advice",
    tagVariant: "advice",
    meta: "New York, NY",
    title: "Transportation tips for NYC Fintech interns",
    excerpt:
      "Don't rely on Uber during rush hour. The subway is faster and cheaper. Here is a map of the best lines for Wall St...",
    href: "/offers",
  },
];

function relativeTime(dateStr: string | null | undefined): string {
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

function excerptFromSnapshots(snapshotsJson: string | null | undefined): string {
  if (!snapshotsJson) return "";
  try {
    const parsed = JSON.parse(snapshotsJson) as { company?: string }[];
    if (!Array.isArray(parsed)) return "";
    const companies = parsed.map((s) => s.company).filter(Boolean).join(" vs ");
    return companies ? `Comparing ${companies}` : "";
  } catch {
    return "";
  }
}

function NoteCardSkeleton() {
  return (
    <div className="rounded-xl p-5 border border-border bg-card animate-pulse space-y-3">
      <div className="flex gap-3">
        <div className="h-5 w-20 rounded bg-muted" />
        <div className="h-5 w-24 rounded bg-muted" />
      </div>
      <div className="h-5 w-3/4 rounded bg-muted" />
      <div className="h-4 w-full rounded bg-muted" />
      <div className="h-4 w-2/3 rounded bg-muted" />
    </div>
  );
}

export function CommunityNotesSection({
  title = "Community Notes",
  subtitle = "Real-time insights from fellow interns",
  viewAllHref = "/offers",
  viewAllLabel = "View all posts",
  notes,
  trendingCitiesProps,
  className,
}: CommunityNotesSectionProps) {
  const [liveNotes, setLiveNotes] = useState<CommunityNoteCardProps[] | null>(null);
  const [isLoading, setIsLoading] = useState(!notes);

  useEffect(() => {
    if (notes) return; // caller provided static notes — skip fetch
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchPublishedPosts(0, 3);
        if (cancelled) return;
        if (result.content.length === 0) {
          setLiveNotes(fallbackNotes);
          return;
        }
        const detailed = await Promise.all(
          result.content.map((post) => fetchPost(post.id).catch(() => null)),
        );
        if (cancelled) return;
        const mapped: CommunityNoteCardProps[] = result.content.map((post, i) => {
          const detail = detailed[i];
          const bodyExcerpt = detail?.body ? detail.body.slice(0, 120) + (detail.body.length > 120 ? "…" : "") : "";
          const snapshotExcerpt = excerptFromSnapshots(detail?.offerSnapshots);
          return {
            tag: post.type === "comparison" ? "Comparison" : "Acceptance",
            tagVariant: post.type === "comparison" ? "salary" : "advice",
            meta: `${relativeTime(post.publishedAt ?? post.createdAt)} • @${post.authorUsername}`,
            title: post.title,
            excerpt: bodyExcerpt || snapshotExcerpt || "View this post for full details.",
            href: `/offers/${post.id}`,
          };
        });
        setLiveNotes(mapped);
      } catch {
        if (!cancelled) setLiveNotes(fallbackNotes);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [notes]);

  const displayNotes = notes ?? liveNotes ?? fallbackNotes;

  return (
    <section
      id="community-notes"
      className={cn("py-24 max-w-7xl mx-auto px-6 lg:px-8", className)}
    >
      <div className="grid grid-cols-3 gap-12">
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            </div>
            <Link
              href={viewAllHref}
              className="text-primary hover:text-primary-dark text-sm font-medium flex items-center"
            >
              {viewAllLabel} <ArrowRight className="size-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              <>
                <NoteCardSkeleton />
                <NoteCardSkeleton />
                <NoteCardSkeleton />
              </>
            ) : (
              displayNotes.map((note, i) => (
                <CommunityNoteCard key={i} {...note} />
              ))
            )}
          </div>
        </div>

        <div className="space-y-8">
          <TrendingCitiesWidget {...trendingCitiesProps} />

        </div>
      </div>
    </section>
  );
}
