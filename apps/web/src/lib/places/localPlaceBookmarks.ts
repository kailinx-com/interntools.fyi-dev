const STORAGE_KEY = "interntools.savedLocations";

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function listSavedLocationDescriptions(): string[] {
  if (typeof window === "undefined") return [];
  return parseList(localStorage.getItem(STORAGE_KEY));
}

export function hasSavedLocation(description: string): boolean {
  const d = description.trim();
  if (!d) return false;
  return listSavedLocationDescriptions().some((x) => x === d);
}

export function addSavedLocation(description: string): void {
  const d = description.trim();
  if (!d || typeof window === "undefined") return;
  const list = listSavedLocationDescriptions();
  if (list.includes(d)) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...list, d]));
}

export function removeSavedLocation(description: string): void {
  const d = description.trim();
  if (!d || typeof window === "undefined") return;
  const list = listSavedLocationDescriptions().filter((x) => x !== d);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function toggleSavedLocation(description: string): boolean {
  if (hasSavedLocation(description)) {
    removeSavedLocation(description);
    return false;
  }
  addSavedLocation(description);
  return true;
}
