export function getPlacesApiKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ?? "";
}

const MAX_MATCH_TOKENS = 12;

export function normalizePlaceId(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("places/")) return t.slice("places/".length);
  return t;
}

export function encodePlaceIdForPath(placeId: string): string {
  return encodeURIComponent(normalizePlaceId(placeId));
}

export function decodePlaceIdFromPath(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function encodeLocationDescriptionForPath(description: string): string {
  return encodeURIComponent(description.trim());
}

/** True when the URL segment should use description-based UI (no Places Details GET). */
export function isLegacyLocationDescriptionPath(decoded: string): boolean {
  return decoded.includes(",");
}

export function matchTokensFromLocationDescription(description: string): string[] {
  const trimmed = description.trim();
  if (!trimmed) return [];

  const ordered: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    const s = raw.trim();
    if (s.length < 2) return;
    const k = s.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    ordered.push(s);
  };

  for (const part of trimmed.split(",")) {
    push(part);
  }
  if (ordered.length === 0 && trimmed.length >= 2) {
    push(trimmed);
  }
  return ordered.slice(0, MAX_MATCH_TOKENS);
}

export function googleMapsSearchUrlForLocation(description: string): string {
  const q = description.trim();
  if (!q) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export type PlaceDisplayName = {
  text?: string;
};

export type PlacePhoto = {
  name?: string;
  widthPx?: number;
  heightPx?: number;
};

export type AddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

export type PlaceSearchResult = {
  id: string;
  displayName: string;
  formattedAddress: string;
  firstPhotoName: string | null;
};

export type PlaceDetails = {
  id: string;
  displayName: string;
  formattedAddress: string;
  googleMapsUri: string | null;
  firstPhotoName: string | null;
  matchTokens: string[];
};

const SEARCH_FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.photos,places.googleMapsUri";

const DETAILS_FIELD_MASK =
  "id,displayName,formattedAddress,photos,googleMapsUri,location,addressComponents";

type SearchTextResponse = {
  places?: Array<{
    id?: string;
    name?: string;
    displayName?: PlaceDisplayName;
    formattedAddress?: string;
    photos?: PlacePhoto[];
    googleMapsUri?: string;
  }>;
};

type GetPlaceResponse = {
  id?: string;
  name?: string;
  displayName?: PlaceDisplayName;
  formattedAddress?: string;
  photos?: PlacePhoto[];
  googleMapsUri?: string;
  addressComponents?: AddressComponent[];
};

function resourceIdFromPlace(p: { id?: string; name?: string }): string {
  const raw = p.name ?? p.id ?? "";
  return normalizePlaceId(raw);
}

function mapSearchPlace(p: NonNullable<SearchTextResponse["places"]>[number]): PlaceSearchResult {
  const id = resourceIdFromPlace(p);
  const displayName = p.displayName?.text ?? "Unknown place";
  const formattedAddress = p.formattedAddress ?? "";
  const firstPhoto = p.photos?.[0];
  return {
    id,
    displayName,
    formattedAddress,
    firstPhotoName: firstPhoto?.name ?? null,
  };
}

function hasType(types: string[] | undefined, t: string): boolean {
  return types?.some((x) => x === t) ?? false;
}

export function buildMatchTokensFromPlace(
  formattedAddress: string,
  addressComponents: AddressComponent[] | undefined,
): string[] {
  const ordered: string[] = [];
  const seenOrder = new Set<string>();
  const push = (raw: string | undefined | null) => {
    const s = raw?.trim();
    if (!s || s.length < 2) return;
    const k = s.toLowerCase();
    if (seenOrder.has(k)) return;
    seenOrder.add(k);
    ordered.push(s);
  };

  for (const c of addressComponents ?? []) {
    const types = c.types ?? [];
    if (hasType(types, "locality") || hasType(types, "sublocality") || hasType(types, "neighborhood")) {
      push(c.longText);
      if (c.shortText && c.shortText !== c.longText) push(c.shortText);
    }
    if (hasType(types, "administrative_area_level_1")) {
      push(c.longText);
    }
    if (hasType(types, "country")) {
      push(c.longText);
    }
  }

  const firstSeg = formattedAddress.split(",")[0]?.trim();
  if (firstSeg && firstSeg.length >= 2) push(firstSeg);

  return ordered.slice(0, MAX_MATCH_TOKENS);
}

export type PlaceAutocompleteSuggestion = {
  placeId: string;
  description: string;
};

const AUTOCOMPLETE_PRIMARY_TYPES = [
  "locality",
  "sublocality",
  "neighborhood",
  "administrative_area_level_1",
  "country",
] as const;

export async function fetchPlaceAutocompleteSuggestions(
  input: string,
): Promise<PlaceAutocompleteSuggestion[]> {
  const key = getPlacesApiKey();
  if (!input.trim() || !key) return [];

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
    },
    body: JSON.stringify({
      input: input.trim(),
      includedPrimaryTypes: [...AUTOCOMPLETE_PRIMARY_TYPES],
      languageCode: "en",
      regionCode: "US",
    }),
  });

  if (!res.ok) return [];

  const data = (await res.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string;
        text?: { text?: string };
      };
    }>;
  };

  const out: PlaceAutocompleteSuggestion[] = [];
  for (const s of data.suggestions ?? []) {
    const pp = s.placePrediction;
    const placeId = pp?.placeId?.trim();
    const description = pp?.text?.text?.trim();
    if (!placeId || !description) continue;
    out.push({ placeId, description });
  }
  return out;
}

export async function searchPlacesByText(text: string): Promise<PlaceSearchResult[]> {
  const key = getPlacesApiKey();
  if (!text.trim() || !key) return [];

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": SEARCH_FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: text.trim(),
      languageCode: "en",
      regionCode: "US",
      maxResultCount: 20,
    }),
  });

  if (!res.ok) return [];

  const data = (await res.json()) as SearchTextResponse;
  const places = data.places ?? [];
  return places.map((p) => mapSearchPlace(p));
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const key = getPlacesApiKey();
  const id = normalizePlaceId(placeId);
  if (!id || !key) return null;

  const pathId = encodeURIComponent(id);
  const res = await fetch(`https://places.googleapis.com/v1/places/${pathId}`, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": DETAILS_FIELD_MASK,
    },
  });

  if (!res.ok) return null;

  const p = (await res.json()) as GetPlaceResponse;
  const rid = resourceIdFromPlace(p);
  const firstPhoto = p.photos?.[0];
  const formattedAddress = p.formattedAddress ?? "";
  const matchTokens = buildMatchTokensFromPlace(formattedAddress, p.addressComponents);
  return {
    id: rid,
    displayName: p.displayName?.text ?? "Unknown place",
    formattedAddress,
    googleMapsUri: p.googleMapsUri ?? null,
    firstPhotoName: firstPhoto?.name ?? null,
    matchTokens,
  };
}

export function getPlacePhotoMediaUrl(photoName: string, maxWidthPx = 400): string | null {
  const key = getPlacesApiKey();
  if (!photoName || !key) return null;
  const path = photoName.startsWith("places/") ? photoName : `places/${photoName}`;
  const encoded = encodeURIComponent(path);
  const params = new URLSearchParams({
    maxWidthPx: String(maxWidthPx),
    key,
  });
  return `https://places.googleapis.com/v1/${encoded}/media?${params.toString()}`;
}
