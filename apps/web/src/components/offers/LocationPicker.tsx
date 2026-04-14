"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  fetchPlaceAutocompleteSuggestions,
  getPlacesApiKey,
  type PlaceAutocompleteSuggestion,
} from "@/lib/places/client";

export type PlaceSuggestion = PlaceAutocompleteSuggestion;

type LocationPickerProps = {
  value: string;
  onChange: (value: string) => void;
  onPickSuggestion?: (suggestion: PlaceAutocompleteSuggestion) => void;
  emitValueOnInput?: boolean;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  showMapPin?: boolean;
  inputId?: string;
  inputTestId?: string;
};

export function LocationPicker({
  value,
  onChange,
  onPickSuggestion,
  emitValueOnInput = true,
  placeholder = "Search city…",
  className,
  containerClassName,
  disabled,
  showMapPin = true,
  inputId,
  inputTestId = "location-input",
}: LocationPickerProps) {
  const [suggestions, setSuggestions] = useState<PlaceAutocompleteSuggestion[]>([]);
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

  const handleInputChange = useCallback(
    (nextInput: string) => {
      setInputValue(nextInput);
      setHighlightIndex(-1);
      if (emitValueOnInput) {
        onChange(nextInput);
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!nextInput.trim() || !getPlacesApiKey()) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      debounceRef.current = setTimeout(() => {
        void fetchPlaceAutocompleteSuggestions(nextInput).then((results) => {
          setSuggestions(results);
          setOpen(results.length > 0);
        });
      }, 300);
    },
    [emitValueOnInput, onChange],
  );

  const selectSuggestion = useCallback(
    (suggestion: PlaceAutocompleteSuggestion) => {
      onChange(suggestion.description);
      setInputValue(suggestion.description);
      onPickSuggestion?.(suggestion);
      setSuggestions([]);
      setOpen(false);
    },
    [onChange, onPickSuggestion],
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

  if (!getPlacesApiKey()) {
    return (
      <div ref={containerRef} className={cn("relative", containerClassName)}>
        <div className="flex items-center gap-2">
          {showMapPin ? (
            <MapPin className="size-4 text-muted-foreground shrink-0" aria-hidden />
          ) : null}
          <Input
            id={inputId}
            data-testid={inputTestId}
            type="text"
            placeholder={placeholder}
            className={className ?? "text-sm h-10"}
            disabled={disabled}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            autoComplete="off"
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Add <code className="text-[10px]">NEXT_PUBLIC_GOOGLE_PLACES_API_KEY</code> for address
          autocomplete.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", containerClassName)}>
      <div className="flex items-center gap-2">
        {showMapPin ? (
          <MapPin className="size-4 text-muted-foreground shrink-0" aria-hidden />
        ) : null}
        <Input
          id={inputId}
          data-testid={inputTestId}
          type="text"
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
          className="absolute z-50 mt-1 w-full min-w-48 rounded-md border bg-popover p-1 shadow-md max-h-60 overflow-auto"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.placeId}-${i}`}
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
