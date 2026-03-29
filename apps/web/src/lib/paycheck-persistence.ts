"use client";

import { apiRequest } from "@/lib/auth/http";
import { type PaycheckConfig, type PeriodRow } from "@/lib/paycheck";
import { formatMonthYear } from "@/lib/paycheck-format";

export type SaveScenarioRequest = {
  name: string;
  config: PaycheckConfig;
};

export type ScenarioSummary = {
  id: number;
  name: string;
  createdAt: string;
};

export type ScenarioDetail = ScenarioSummary & {
  config: PaycheckConfig;
};

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
  months: PlannerMonthNet[];
  expenses: PlannerExpense[];
};

export type SavePlannerRequest = {
  name: string;
  data: PlannerDocumentPayload;
};

export type PlannerSummary = {
  id: string;
  name: string;
  createdAt: string;
};

export type PlannerDetail = PlannerSummary & {
  data: PlannerDocumentPayload;
};

function monthKeyFromIso(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function monthLabelFromIso(isoDate: string): string {
  return formatMonthYear(isoDate);
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

export function parsePlannerMonths(rawMonthly: string | null): PlannerMonthNet[] {
  if (!rawMonthly) {
    return [];
  }

  try {
    const monthlyRows = JSON.parse(decodeURIComponent(rawMonthly)) as PeriodRow[];

    return monthlyRows.map((row) => ({
      key: monthKeyFromIso(row.startDate),
      label: monthLabelFromIso(row.startDate),
      netPay: row.netPay,
    }));
  } catch {
    return [];
  }
}

export async function saveScenario(
  token: string,
  payload: SaveScenarioRequest,
): Promise<ScenarioDetail> {
  return apiRequest<ScenarioDetail>("/paycheck/scenarios", {
    method: "POST",
    token,
    body: {
      name: normalizeSavedName(payload.name),
      config: payload.config,
    },
  });
}

export async function listScenarios(token: string): Promise<ScenarioSummary[]> {
  return apiRequest<ScenarioSummary[]>("/paycheck/scenarios", { token });
}

export async function getScenario(
  token: string,
  id: number,
): Promise<ScenarioDetail> {
  return apiRequest<ScenarioDetail>(`/paycheck/scenarios/${id}`, { token });
}

export async function deleteScenario(token: string, id: number): Promise<void> {
  await apiRequest<void>(`/paycheck/scenarios/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function savePlannerDocument(
  token: string,
  payload: SavePlannerRequest,
): Promise<PlannerDetail> {
  return apiRequest<PlannerDetail>("/paycheck/planner", {
    method: "POST",
    token,
    body: {
      name: normalizeSavedName(payload.name),
      data: payload.data,
    },
  });
}

export async function listPlannerDocuments(
  token: string,
): Promise<PlannerSummary[]> {
  return apiRequest<PlannerSummary[]>("/paycheck/planner", { token });
}

export async function getPlannerDocument(
  token: string,
  id: string,
): Promise<PlannerDetail> {
  return apiRequest<PlannerDetail>(`/paycheck/planner/${id}`, { token });
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
