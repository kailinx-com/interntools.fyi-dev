"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Bookmark, ExternalLink, MapPin } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  decodePlaceIdFromPath,
  getPlaceDetails,
  getPlacePhotoMediaUrl,
  getPlacesApiKey,
  googleMapsSearchUrlForLocation,
  isLegacyLocationDescriptionPath,
  matchTokensFromLocationDescription,
  normalizePlaceId,
  searchPlacesByText,
  type PlaceDetails,
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
  const decoded = decodePlaceIdFromPath(rawSegment).trim();
  const legacy = decoded.length > 0 && isLegacyLocationDescriptionPath(decoded);

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [loadingPlace, setLoadingPlace] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  const bookmarkKey = useMemo(() => {
    if (!decoded) return "";
    if (legacy) return decoded;
    const addr = placeDetails?.formattedAddress?.trim();
    const name = placeDetails?.displayName?.trim();
    return addr || name || "";
  }, [decoded, legacy, placeDetails]);

  useEffect(() => {
    if (!bookmarkKey) {
      setBookmarked(false);
      return;
    }
    setBookmarked(hasSavedLocation(bookmarkKey));
  }, [bookmarkKey]);

  useEffect(() => {
    if (!decoded) {
      setPlaceDetails(null);
      setPlaceError(null);
      setLoadingPlace(false);
      return;
    }
    if (legacy) {
      setPlaceDetails(null);
      setPlaceError(null);
      setLoadingPlace(false);
      return;
    }

    let cancelled = false;
    setLoadingPlace(true);
    setPlaceError(null);
    setPlaceDetails(null);

    void (async () => {
      try {
        let d = await getPlaceDetails(normalizePlaceId(decoded));
        if (!d && getPlacesApiKey()) {
          const found = await searchPlacesByText(decoded);
          if (found[0]?.id) {
            d = await getPlaceDetails(found[0].id);
          }
        }
        if (cancelled) return;
        if (!d) {
          setPlaceError("Could not load place details from Google Places.");
          setPlaceDetails(null);
        } else {
          setPlaceDetails(d);
        }
      } catch {
        if (!cancelled) {
          setPlaceError("Could not load place details.");
          setPlaceDetails(null);
        }
      } finally {
        if (!cancelled) setLoadingPlace(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [decoded, legacy]);

  useEffect(() => {
    if (!decoded) {
      setLoadingPosts(false);
      setPosts([]);
      return;
    }

    if (!legacy) {
      if (loadingPlace) {
        setLoadingPosts(true);
        return;
      }
    }

    let cancelled = false;
    setLoadingPosts(true);
    setPostsError(null);

    void (async () => {
      try {
        let tokens: string[];
        if (legacy) {
          tokens = matchTokensFromLocationDescription(decoded);
          if (tokens.length === 0) {
            tokens = [relatedSearchTextFromDescription(decoded)];
          }
        } else if (placeDetails) {
          tokens =
            placeDetails.matchTokens.length > 0
              ? placeDetails.matchTokens
              : [relatedSearchTextFromDescription(placeDetails.formattedAddress || placeDetails.displayName)];
        } else {
          tokens = matchTokensFromLocationDescription(decoded);
          if (tokens.length === 0) {
            tokens = [relatedSearchTextFromDescription(decoded)];
          }
        }
        const relatedPosts = await fetchRelatedPostsByLocationTokens(tokens);
        if (cancelled) return;
        setPosts(relatedPosts);
      } catch {
        if (!cancelled) {
          setPostsError("Failed to load related posts.");
          setPosts([]);
        }
      } finally {
        if (!cancelled) setLoadingPosts(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [decoded, legacy, loadingPlace, placeDetails]);

  const matchSummary = useMemo(() => {
    if (legacy) {
      const matchTokens = matchTokensFromLocationDescription(decoded);
      return matchTokens.length > 0
        ? matchTokens.join(", ")
        : relatedSearchTextFromDescription(decoded);
    }
    if (placeDetails) {
      const t = placeDetails.matchTokens;
      return t.length > 0
        ? t.join(", ")
        : relatedSearchTextFromDescription(placeDetails.formattedAddress || placeDetails.displayName);
    }
    return relatedSearchTextFromDescription(decoded);
  }, [decoded, legacy, placeDetails]);

  const mapsUrl = useMemo(() => {
    if (legacy) return googleMapsSearchUrlForLocation(decoded);
    if (placeDetails?.googleMapsUri) return placeDetails.googleMapsUri;
    if (placeDetails) {
      return googleMapsSearchUrlForLocation(placeDetails.formattedAddress || placeDetails.displayName);
    }
    return "";
  }, [decoded, legacy, placeDetails]);

  const heroPhotoUrl = useMemo(() => {
    if (legacy || !placeDetails?.firstPhotoName) return null;
    return getPlacePhotoMediaUrl(placeDetails.firstPhotoName, 800);
  }, [legacy, placeDetails]);

  function onToggleBookmark() {
    if (!bookmarkKey) return;
    const next = toggleSavedLocation(bookmarkKey);
    setBookmarked(next);
  }

  const showBookmark = !isAuthLoading && isAuthenticated && (legacy || placeDetails);
  const showSignInHint = !isAuthLoading && !isAuthenticated;

  const titleText = legacy
    ? displayTitleFromDescription(decoded)
    : placeDetails?.displayName ?? "";
  const subtitleText = legacy
    ? displayTitleFromDescription(decoded).trim() !== decoded
      ? decoded
      : null
    : placeDetails
      ? placeDetails.formattedAddress &&
        placeDetails.formattedAddress.trim() !== placeDetails.displayName.trim()
        ? placeDetails.formattedAddress
        : null
      : null;

  if (!decoded) {
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

        {!legacy && placeError && (
          <p className="text-destructive text-sm" role="alert">
            {placeError}
          </p>
        )}

        {postsError && !loadingPosts && (
          <p className="text-destructive text-sm" role="alert">
            {postsError}
          </p>
        )}

        <div className="space-y-4">
          {!legacy && loadingPlace ? (
            <div className="flex h-40 items-center justify-center rounded-lg border bg-muted/60">
              <Spinner className="size-8" />
            </div>
          ) : (
            <>
              <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-lg border bg-muted/60">
                {heroPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote Google Places photo URL
                  <img
                    src={heroPhotoUrl}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <MapPin className="relative z-1 size-5 text-muted-foreground" aria-hidden />
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  {!legacy && !placeDetails && placeError ? (
                    <h1 className="text-3xl font-bold tracking-tight">Location</h1>
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold tracking-tight">{titleText}</h1>
                      {subtitleText ? (
                        <p className="text-muted-foreground mt-2">{subtitleText}</p>
                      ) : null}
                    </>
                  )}
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
                {showBookmark ? (
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
                ) : showSignInHint ? (
                  <p className="text-sm text-muted-foreground text-right max-w-56">
                    <Link href="/login" className="font-medium text-primary hover:underline">
                      Sign in
                    </Link>{" "}
                    to save this location for quick access on Search.
                  </p>
                ) : null}
              </div>
            </>
          )}
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
