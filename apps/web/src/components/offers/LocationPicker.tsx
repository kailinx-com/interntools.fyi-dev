"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

export type PlaceSuggestion = {
  placeId: string;
  description: string;
};

type GoogleAutocompletePrediction = {
  placePrediction: {
    placeId: string;
    text: { text: string };
  };
};

type GoogleAutocompleteResponse = {
  suggestions?: GoogleAutocompletePrediction[];
};

function getApiKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ?? "";
}

async function fetchPlaceSuggestions(
  input: string,
): Promise<PlaceSuggestion[]> {
  const apiKey = getApiKey();
  if (!input.trim() || !apiKey) return [];

  const res = await fetch(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify({
        input,
        includedPrimaryTypes: [
          "locality",
          "administrative_area_level_1",
          "sublocality",
        ],
        languageCode: "en",
      }),
    },
  );

  if (!res.ok) return [];

  const data: GoogleAutocompleteResponse = await res.json();

  return (
    data.suggestions?.map((s) => ({
      placeId: s.placePrediction.placeId,
      description: s.placePrediction.text.text,
    })) ?? []
  );
}

type LocationPickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function LocationPicker({
  value,
  onChange,
  placeholder = "Search city…",
  className,
  disabled,
}: LocationPickerProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [inputValue, setInputValue] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = useCallback((nextInput: string) => {
    setInputValue(nextInput);
    setHighlightIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!nextInput.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      void fetchPlaceSuggestions(nextInput).then((results) => {
        setSuggestions(results);
        setOpen(results.length > 0);
      });
    }, 300);
  }, []);

  const selectSuggestion = useCallback(
    (suggestion: PlaceSuggestion) => {
      onChange(suggestion.description);
      setInputValue(suggestion.description);
      setSuggestions([]);
      setOpen(false);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open || suggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
          selectSuggestion(suggestions[highlightIndex]);
        }
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [open, suggestions, highlightIndex, selectSuggestion],
  );

  if (!getApiKey()) {
    return (
      <div className="flex items-center gap-1">
        <MapPin className="size-3 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={value}
          readOnly
          placeholder="Set NEXT_PUBLIC_GOOGLE_PLACES_API_KEY"
          className="text-xs h-8 w-full bg-transparent outline-none text-muted-foreground"
          disabled
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1">
        <MapPin className="size-3 text-muted-foreground shrink-0" />
        <Input
          data-testid="location-input"
          placeholder={placeholder}
          className={className ?? "text-xs h-8"}
          disabled={disabled}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          autoComplete="off"
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              role="option"
              aria-selected={i === highlightIndex}
              data-testid="location-suggestion"
              className={`flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm ${
                i === highlightIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(s);
              }}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              <MapPin className="size-3 text-muted-foreground shrink-0" />
              {s.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
