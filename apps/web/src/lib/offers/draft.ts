"use client";

const KEY = "offers-compare-draft";

export type CompareOffersDraftEntry = {
  id: string;
  company: string;
  role: string;
  compensation: string;
};

export type CompareOffersDraft = {
  offers: CompareOffersDraftEntry[];
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function saveCompareOffersDraft(draft: CompareOffersDraft): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(KEY, JSON.stringify(draft));
}

export function getCompareOffersDraft(): CompareOffersDraft | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CompareOffersDraft;
  } catch {
    return null;
  }
}

export function clearCompareOffersDraft(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(KEY);
}
