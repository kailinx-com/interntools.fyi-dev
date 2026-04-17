"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, ChevronRight, Search } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PageShell } from "@/components/layout/PageShell";
import { LocationPicker } from "@/components/offers/LocationPicker";
import { Button } from "@/components/ui/button";
import {
  encodeLocationDescriptionForPath,
  encodePlaceIdForPath,
  getPlacesApiKey,
  searchPlacesByText,
  type PlaceAutocompleteSuggestion,
} from "@/lib/places/client";
import { listSavedLocationDescriptions } from "@/lib/places/localPlaceBookmarks";

const CRITERIA_DEBOUNCE_MS = 300;

function criteriaFromSearchParams(searchParams: URLSearchParams): string {
  return searchParams.get("criteria") ?? searchParams.get("q") ?? "";
}

export function SearchPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showSavedSection =
    !isAuthLoading && isAuthenticated && savedLocations.length > 0;

  const refreshSaved = useCallback(() => {
    setSavedLocations(listSavedLocationDescriptions());
  }, []);

  const replaceCriteriaInUrl = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        router.replace(pathname, { scroll: false });
        return;
      }
      router.replace(
        `${pathname}?${new URLSearchParams({ criteria: trimmed }).toString()}`,
        { scroll: false },
      );
    },
    [pathname, router],
  );

  const clearDebounceTimer = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const searchParamsSig = searchParams.toString();

  useEffect(() => {
    setQuery(criteriaFromSearchParams(searchParams));
  }, [searchParams, searchParamsSig]);

  useEffect(() => {
    function syncFromBrowserLocation() {
      const params = new URLSearchParams(window.location.search);
      setQuery(params.get("criteria") ?? params.get("q") ?? "");
    }

    window.addEventListener("popstate", syncFromBrowserLocation);
    return () => window.removeEventListener("popstate", syncFromBrowserLocation);
  }, []);

  useEffect(() => {
    refreshSaved();
    function onFocus() {
      refreshSaved();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshSaved]);

  useEffect(
    () => () => {
      clearDebounceTimer();
    },
    [clearDebounceTimer],
  );

  function handleQueryChange(value: string) {
    setQuery(value);
    clearDebounceTimer();
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      replaceCriteriaInUrl(value);
    }, CRITERIA_DEBOUNCE_MS);
  }

  async function goToDetailsFromQuery(description: string) {
    clearDebounceTimer();
    const trimmed = description.trim();
    if (!trimmed) return;
    replaceCriteriaInUrl(trimmed);
    if (!getPlacesApiKey()) {
      router.push(`/details/${encodeLocationDescriptionForPath(trimmed)}`);
      return;
    }
    const results = await searchPlacesByText(trimmed);
    if (results[0]?.id) {
      router.push(`/details/${encodePlaceIdForPath(results[0].id)}`);
    } else {
      router.push(`/details/${encodeLocationDescriptionForPath(trimmed)}`);
    }
  }

  function onPickSuggestion(s: PlaceAutocompleteSuggestion) {
    clearDebounceTimer();
    replaceCriteriaInUrl(s.description);
    const id = s.placeId.trim();
    if (!id) return;
    router.push(`/details/${encodePlaceIdForPath(id)}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void goToDetailsFromQuery(query);
  }

  const showApiKeyHint = !getPlacesApiKey();

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Search by location</h1>
          <p className="text-muted-foreground text-sm">
            Pick a suggestion or type a location and press Search. The details page loads place
            information from Google Places (remote API) using the place ID in the URL when available.
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2 min-w-0 w-full">
            <label htmlFor="place-search" className="text-sm font-medium">
              Location
            </label>
            <LocationPicker
              inputId="place-search"
              inputTestId="place-search-input"
              value={query}
              onChange={handleQueryChange}
              onPickSuggestion={onPickSuggestion}
              placeholder="City, state, or region"
              containerClassName="w-full"
              className="h-11 w-full text-base"
            />
          </div>
          <Button type="submit" className="h-11 gap-2 sm:w-auto w-full shrink-0">
            <Search className="size-4" />
            Search
          </Button>
        </form>

        {showApiKeyHint ? (
          <p className="text-sm text-amber-700 dark:text-amber-300" role="status">
            Set <code className="text-xs">NEXT_PUBLIC_GOOGLE_PLACES_API_KEY</code> for autocomplete
            suggestions.
          </p>
        ) : null}

        {!isAuthLoading && isAuthenticated ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            Bookmarks for locations are stored in this browser only.
          </p>
        ) : null}

        {showSavedSection ? (
          <section>
            <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
              <Bookmark className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              Saved locations
            </h2>
            <ul className="divide-y rounded-lg border border-border/80 bg-card text-card-foreground shadow-sm">
              {savedLocations.map((desc) => (
                <li key={desc}>
                  <Link
                    href={`/details/${encodeLocationDescriptionForPath(desc)}`}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
                  >
                    <span className="min-w-0 truncate">{desc}</span>
                    <ChevronRight
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}
