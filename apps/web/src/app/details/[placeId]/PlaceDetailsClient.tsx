"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Bookmark, ExternalLink, MapPin } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  decodePlaceIdFromPath,
  googleMapsSearchUrlForLocation,
  matchTokensFromLocationDescription,
} from "@/lib/places/client";
import {
  hasSavedLocation,
  toggleSavedLocation,
} from "@/lib/places/localPlaceBookmarks";
import { fetchRelatedPostsByLocationTokens, type PostSummary } from "@/lib/offers/api";
import { cn } from "@/lib/utils";

function displayTitleFromDescription(description: string): string {
  const t = description.trim();
  if (!t) return "Location";
  const first = t.split(",")[0]?.trim();
  return first && first.length > 0 ? first : t;
}

function relatedSearchTextFromDescription(description: string): string {
  const t = description.trim();
  const first = t.split(",")[0]?.trim();
  if (first && first.length >= 2) return first;
  return t;
}

export function PlaceDetailsClient() {
  const params = useParams();
  const rawSegment = typeof params.placeId === "string" ? params.placeId : "";
  const description = decodePlaceIdFromPath(rawSegment).trim();

  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(hasSavedLocation(description));
  }, [description]);

  useEffect(() => {
    if (!description) {
      setLoadingPosts(false);
      setPosts([]);
      return;
    }

    let cancelled = false;
    setLoadingPosts(true);
    setError(null);

    void (async () => {
      try {
        const tokens = matchTokensFromLocationDescription(description);
        const relatedPosts = await fetchRelatedPostsByLocationTokens(
          tokens.length > 0 ? tokens : [relatedSearchTextFromDescription(description)],
        );
        if (cancelled) return;
        setPosts(relatedPosts);
      } catch {
        if (!cancelled) {
          setError("Failed to load related posts.");
          setPosts([]);
        }
      } finally {
        if (!cancelled) setLoadingPosts(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [description]);

  const matchTokens = matchTokensFromLocationDescription(description);
  const matchSummary =
    matchTokens.length > 0 ? matchTokens.join(", ") : relatedSearchTextFromDescription(description);
  const mapsUrl = googleMapsSearchUrlForLocation(description);

  function onToggleBookmark() {
    const next = toggleSavedLocation(description);
    setBookmarked(next);
  }

  if (!description) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14 space-y-4">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2" asChild>
            <Link href="/search">
              <ArrowLeft className="size-4" />
              Search
            </Link>
          </Button>
          <p className="text-destructive text-sm" role="alert">
            Invalid location.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-14 space-y-8">
        <div>
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-4" asChild>
            <Link href="/search">
              <ArrowLeft className="size-4" />
              Search
            </Link>
          </Button>
        </div>

        {error && !loadingPosts && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div className="flex h-20 items-center justify-center rounded-lg border bg-muted/60">
            <MapPin className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {displayTitleFromDescription(description)}
              </h1>
              {displayTitleFromDescription(description).trim() !== description ? (
                <p className="text-muted-foreground mt-2">{description}</p>
              ) : null}
              {mapsUrl ? (
                <p className="mt-3">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    Open in Google Maps
                    <ExternalLink className="size-3.5" />
                  </a>
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant={bookmarked ? "secondary" : "outline"}
              size="sm"
              className="shrink-0 gap-2"
              onClick={onToggleBookmark}
            >
              <Bookmark className={cn("size-4", bookmarked && "fill-current")} aria-hidden />
              {bookmarked ? "Saved" : "Save location"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Posts for this area</CardTitle>
            <p className="text-sm text-muted-foreground">
              Match: <span className="text-foreground">{matchSummary}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingPosts ? (
              <div className="flex justify-center py-12">
                <Spinner className="size-8" />
              </div>
            ) : posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts yet.</p>
            ) : (
              <ul className="space-y-2">
                {posts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/offers/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border border-border/80 bg-card px-4 py-3 transition-colors hover:bg-accent/50"
                    >
                      <span className="font-medium inline-flex items-center gap-1.5">
                        {p.title}
                        <ExternalLink
                          className="size-3.5 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                      </span>
                      <span className="text-muted-foreground text-sm block mt-0.5">
                        @{p.authorUsername}
                        {p.type === "comparison" ? (
                          <span className="text-muted-foreground"> · comparison</span>
                        ) : p.officeLocation?.trim() ? (
                          ` · ${p.officeLocation}`
                        ) : (
                          ""
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
