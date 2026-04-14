import type { Offer } from "./api";

export function uniqueOfficeLocationsFromOffers(offers: Offer[] | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const o of offers ?? []) {
    const t = o.officeLocation?.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

export function postLocationLine(
  postType: "acceptance" | "comparison",
  postOfficeLocation: string | null | undefined,
  offers: Offer[] | null | undefined,
): string | null {
  if (postType === "comparison") {
    const locs = uniqueOfficeLocationsFromOffers(offers);
    return locs.length > 0 ? locs.join(" · ") : null;
  }
  const t = postOfficeLocation?.trim();
  return t ? t : null;
}
