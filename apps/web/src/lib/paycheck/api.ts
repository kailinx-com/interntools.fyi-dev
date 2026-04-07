"use client";

import { apiRequest } from "@/lib/auth/http";
import {
  DEFAULT_PAYCHECK_CONFIG,
  type PaycheckConfig,
} from "./index";

export type PlannerMonthNet = {
  key: string;
  label: string;
  netPay: number;
};

export type PlannerExpense = {
  id: string;
  name: string;
  defaultAmount: number;
  overrides: Record<string, number>;
};

export type PlannerDocumentPayload = {
  expenses: PlannerExpense[];
};

export type SaveCalculatorConfigRequest = {
  name: string;
  config: PaycheckConfig;
};

export type SavedCalculatorConfigSummary = {
  id: number;
  name: string;
  createdAt: string;
};

export type SavedCalculatorConfigDetail = SavedCalculatorConfigSummary & {
  config: PaycheckConfig;
};

export type SavePlannerDocumentRequest = {
  name: string;
  plannerData: PlannerDocumentPayload;
};

export type SavedPlannerDocumentSummary = {
  id: string;
  name: string;
  createdAt: string;
};

export type SavedPlannerDocumentDetail = {
  id: string;
  name: string;
  plannerData: PlannerDocumentPayload;
};

type LoadedPaycheckConfig = PaycheckConfig & {
  isWorkAuthorized?: boolean;
};

type LoadedPlannerDocumentPayload = {
  expenses?: PlannerExpense[];
  months?: PlannerMonthNet[];
};

type LoadedCalculatorConfigDetail = SavedCalculatorConfigSummary & {
  config: LoadedPaycheckConfig;
};

type LoadedPlannerDocumentDetail = {
  id: string;
  name: string;
  data?: LoadedPlannerDocumentPayload | null;
};

function normalizeConfigForApi(config: PaycheckConfig): PaycheckConfig {
  return {
    ...config,
    arrivalYear: Math.trunc(config.arrivalYear),
  };
}

function normalizeLoadedConfig(config: LoadedPaycheckConfig): PaycheckConfig {
  const nextConfig = { ...config };
  delete nextConfig.isWorkAuthorized;

  return normalizeConfigForApi({
    ...DEFAULT_PAYCHECK_CONFIG,
    ...nextConfig,
  });
}

export function normalizeLoadedPlannerData(
  data: LoadedPlannerDocumentPayload | null | undefined,
): PlannerDocumentPayload {
  return {
    expenses: Array.isArray(data?.expenses) ? data.expenses : [],
  };
}

export function normalizeLoadedCalculatorConfig(
  detail: LoadedCalculatorConfigDetail,
): SavedCalculatorConfigDetail {
  return {
    ...detail,
    config: normalizeLoadedConfig(detail.config),
  };
}

export function normalizeLoadedPlannerDocument(
  detail: LoadedPlannerDocumentDetail,
): SavedPlannerDocumentDetail {
  return {
    id: detail.id,
    name: detail.name,
    plannerData: normalizeLoadedPlannerData(detail.data),
  };
}

export function normalizeSavedName(name: string): string {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("Name is required.");
  }

  if (trimmed.length > 100) {
    throw new Error("Name must be 100 characters or fewer.");
  }

  return trimmed;
}

export function formatSavedItemTimestamp(createdAt: string | null | undefined): string {
  if (typeof createdAt !== "string") {
    return "Saved recently";
  }

  const trimmed = createdAt.trim();

  if (!trimmed) {
    return "Saved recently";
  }

  let normalizedValue = trimmed;

  if (/^\d+$/.test(trimmed)) {
    const numericTimestamp = Number(trimmed);

    if (!Number.isFinite(numericTimestamp)) {
      return "Saved recently";
    }

    normalizedValue =
      trimmed.length <= 10
        ? String(numericTimestamp * 1000)
        : String(numericTimestamp);
  } else if (
    /^\d{4}-\d{2}-\d{2}T/.test(trimmed) &&
    !/(Z|[+-]\d{2}:\d{2})$/i.test(trimmed)
  ) {
    normalizedValue = `${trimmed}Z`;
  }

  const parsed = new Date(normalizedValue);

  if (Number.isNaN(parsed.getTime())) {
    return "Saved recently";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export async function saveCalculatorConfig(
  token: string,
  payload: SaveCalculatorConfigRequest,
): Promise<SavedCalculatorConfigDetail> {
  const detail = await apiRequest<LoadedCalculatorConfigDetail>("/paycheck/scenarios", {
    method: "POST",
    token,
    body: {
      name: normalizeSavedName(payload.name),
      config: normalizeConfigForApi(payload.config),
    },
  });

  return normalizeLoadedCalculatorConfig(detail);
}

export async function listCalculatorConfigs(
  token: string,
): Promise<SavedCalculatorConfigSummary[]> {
  return apiRequest<SavedCalculatorConfigSummary[]>("/paycheck/scenarios", { token });
}

export async function getCalculatorConfig(
  token: string,
  id: number,
): Promise<SavedCalculatorConfigDetail> {
  const detail = await apiRequest<LoadedCalculatorConfigDetail>(`/paycheck/scenarios/${id}`, {
    token,
  });

  return normalizeLoadedCalculatorConfig(detail);
}

export async function deleteCalculatorConfig(
  token: string,
  id: number,
): Promise<void> {
  await apiRequest<void>(`/paycheck/scenarios/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function savePlannerDocument(
  token: string,
  payload: SavePlannerDocumentRequest,
): Promise<SavedPlannerDocumentDetail> {
  const detail = await apiRequest<LoadedPlannerDocumentDetail>("/paycheck/planner", {
    method: "POST",
    token,
    body: {
      name: normalizeSavedName(payload.name),
      data: payload.plannerData,
    },
  });

  return normalizeLoadedPlannerDocument(detail);
}

export async function listPlannerDocuments(
  token: string,
): Promise<SavedPlannerDocumentSummary[]> {
  return apiRequest<SavedPlannerDocumentSummary[]>("/paycheck/planner", { token });
}

export async function getPlannerDocument(
  token: string,
  id: string,
): Promise<SavedPlannerDocumentDetail> {
  const detail = await apiRequest<LoadedPlannerDocumentDetail>(`/paycheck/planner/${id}`, {
    token,
  });

  return normalizeLoadedPlannerDocument(detail);
}

export async function deletePlannerDocument(
  token: string,
  id: string,
): Promise<void> {
  await apiRequest<void>(`/paycheck/planner/${id}`, {
    method: "DELETE",
    token,
  });
}
