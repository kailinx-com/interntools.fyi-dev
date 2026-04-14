"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, ChevronRight, Search } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { LocationPicker } from "@/components/offers/LocationPicker";
import { Button } from "@/components/ui/button";
import {
  encodeLocationDescriptionForPath,
  getPlacesApiKey,
} from "@/lib/places/client";
import { listSavedLocationDescriptions } from "@/lib/places/localPlaceBookmarks";

export function SearchPageClient() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [savedLocations, setSavedLocations] = useState<string[]>([]);

  const refreshSaved = useCallback(() => {
    setSavedLocations(listSavedLocationDescriptions());
  }, []);

  useEffect(() => {
    refreshSaved();
    function onFocus() {
      refreshSaved();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshSaved]);

  function goToDetails(description: string) {
    const trimmed = description.trim();
    if (!trimmed) return;
    router.push(`/details/${encodeLocationDescriptionForPath(trimmed)}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    goToDetails(query);
  }

  const showApiKeyHint = !getPlacesApiKey();

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Search by location</h1>
          <p className="text-muted-foreground text-sm">
            Pick a suggestion from Google Places autocomplete, or type a location and press Search.
            Details use the selected text only (no Places Details API).
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
              onChange={setQuery}
              onPickSuggestion={(s) => {
                goToDetails(s.description);
              }}
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

        <p className="text-sm text-muted-foreground text-center py-2">
          Bookmarks for locations are stored in this browser only.
        </p>

        {savedLocations.length > 0 ? (
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
