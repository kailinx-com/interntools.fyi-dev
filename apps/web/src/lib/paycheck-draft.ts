"use client";

import {
  DEFAULT_PAYCHECK_CONFIG,
  type PaycheckConfig,
} from "@/lib/paycheck";
import {
  normalizeLoadedPlannerData,
  type PlannerDocumentPayload,
} from "@/lib/paycheck-persistence";

const PAYCHECK_DRAFT_KEY = "paycheck-saved-plan-draft";

export type StoredSelectedCalculatorConfig = {
  id: number;
  name: string;
  config: PaycheckConfig;
};

export type StoredSelectedPlannerDocument = {
  id: string;
  name: string;
};

type StoredPaycheckDraft = {
  calculatorConfig?: PaycheckConfig | null;
  plannerData?: PlannerDocumentPayload | null;
  selectedCalculatorConfig?: StoredSelectedCalculatorConfig | null;
  selectedPlannerDocument?: StoredSelectedPlannerDocument | null;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readRawDraft(): StoredPaycheckDraft | null {
  if (!canUseStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(PAYCHECK_DRAFT_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as StoredPaycheckDraft;
  } catch {
    return null;
  }
}

function writeRawDraft(draft: StoredPaycheckDraft): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(PAYCHECK_DRAFT_KEY, JSON.stringify(draft));
}

export function getStoredPaycheckConfig(): PaycheckConfig | null {
  const storedDraft = readRawDraft();

  if (!storedDraft?.calculatorConfig) {
    return null;
  }

  return {
    ...DEFAULT_PAYCHECK_CONFIG,
    ...storedDraft.calculatorConfig,
  };
}

export function saveStoredPaycheckConfig(config: PaycheckConfig): void {
  const storedDraft = readRawDraft();
  writeRawDraft({
    calculatorConfig: {
      ...DEFAULT_PAYCHECK_CONFIG,
      ...config,
    },
    plannerData: normalizeLoadedPlannerData(storedDraft?.plannerData),
    selectedCalculatorConfig: storedDraft?.selectedCalculatorConfig ?? null,
    selectedPlannerDocument: storedDraft?.selectedPlannerDocument ?? null,
  });
}

export function getStoredPlannerData(): PlannerDocumentPayload {
  return normalizeLoadedPlannerData(readRawDraft()?.plannerData);
}

export function saveStoredPlannerData(plannerData: PlannerDocumentPayload): void {
  const storedDraft = readRawDraft();
  writeRawDraft({
    calculatorConfig: storedDraft?.calculatorConfig ?? null,
    plannerData: normalizeLoadedPlannerData(plannerData),
    selectedCalculatorConfig: storedDraft?.selectedCalculatorConfig ?? null,
    selectedPlannerDocument: storedDraft?.selectedPlannerDocument ?? null,
  });
}

export function getStoredSelectedCalculatorConfig(): StoredSelectedCalculatorConfig | null {
  const storedDraft = readRawDraft();

  if (!storedDraft?.selectedCalculatorConfig) {
    return null;
  }

  return {
    ...storedDraft.selectedCalculatorConfig,
    config: {
      ...DEFAULT_PAYCHECK_CONFIG,
      ...storedDraft.selectedCalculatorConfig.config,
    },
  };
}

export function saveStoredSelectedCalculatorConfig(
  selectedCalculatorConfig: StoredSelectedCalculatorConfig | null,
): void {
  const storedDraft = readRawDraft();
  writeRawDraft({
    calculatorConfig: storedDraft?.calculatorConfig ?? null,
    plannerData: normalizeLoadedPlannerData(storedDraft?.plannerData),
    selectedCalculatorConfig,
    selectedPlannerDocument: storedDraft?.selectedPlannerDocument ?? null,
  });
}

export function getStoredSelectedPlannerDocument(): StoredSelectedPlannerDocument | null {
  const storedDraft = readRawDraft();
  return storedDraft?.selectedPlannerDocument ?? null;
}

export function saveStoredSelectedPlannerDocument(
  selectedPlannerDocument: StoredSelectedPlannerDocument | null,
): void {
  const storedDraft = readRawDraft();
  writeRawDraft({
    calculatorConfig: storedDraft?.calculatorConfig ?? null,
    plannerData: normalizeLoadedPlannerData(storedDraft?.plannerData),
    selectedCalculatorConfig: storedDraft?.selectedCalculatorConfig ?? null,
    selectedPlannerDocument,
  });
}

export function clearStoredPaycheckDraft(): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(PAYCHECK_DRAFT_KEY);
}
