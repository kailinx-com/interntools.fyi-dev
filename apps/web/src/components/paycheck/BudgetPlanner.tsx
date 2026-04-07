"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { BudgetChartsSection } from "@/components/paycheck/BudgetChartsSection";
import { BudgetExpensesTable } from "@/components/paycheck/BudgetExpensesTable";
import { BudgetPlannerEmptyState } from "@/components/paycheck/BudgetPlannerEmptyState";
import { BudgetPlannerHeader } from "@/components/paycheck/BudgetPlannerHeader";
import { BudgetQuickAddExpenseCard } from "@/components/paycheck/BudgetQuickAddExpenseCard";
import { PlannerDocumentsPanel } from "@/components/paycheck/PlannerDocumentsPanel";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type PlannerExpense,
  getCalculatorConfig,
  getPlannerDocument,
  listCalculatorConfigs,
  type SavedCalculatorConfigSummary,
  type SavedPlannerDocumentDetail,
} from "@/lib/paycheck/api";
import {
  getStoredPlannerData,
  getStoredSelectedCalculatorConfig,
  saveStoredSelectedCalculatorConfig,
  saveStoredPlannerData,
  type StoredSelectedCalculatorConfig,
} from "@/lib/paycheck/draft";
import {
  calculatePayroll,
  deriveFicaMode,
} from "@/lib/paycheck";
import { formatMonthYear } from "@/lib/paycheck/format";

function getOverride(expense: PlannerExpense, monthKey: string): number {
  return expense.overrides[monthKey] ?? expense.defaultAmount;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function BudgetPlanner() {
  const searchParams = useSearchParams();
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [savedConfigs, setSavedConfigs] = useState<SavedCalculatorConfigSummary[]>(
    [],
  );
  const [selectedConfig, setSelectedConfig] =
    useState<StoredSelectedCalculatorConfig | null>(() =>
      getStoredSelectedCalculatorConfig(),
    );
  const [expenses, setExpenses] = useState<PlannerExpense[]>(
    () => getStoredPlannerData().expenses,
  );
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const [isLoadingSelectedConfig, setIsLoadingSelectedConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const syncSelectedConfig = useCallback(
    (nextSelectedConfig: StoredSelectedCalculatorConfig | null) => {
      setSelectedConfig(nextSelectedConfig);
      saveStoredSelectedCalculatorConfig(nextSelectedConfig);
    },
    [],
  );

  const loadSelectedConfig = useCallback(
    async (configId: number) => {
      if (!token) {
        return;
      }

      setIsLoadingSelectedConfig(true);
      setConfigError(null);

      try {
        const detail = await getCalculatorConfig(token, configId);
        syncSelectedConfig({
          id: detail.id,
          name: detail.name,
          config: detail.config,
        });
      } catch (error) {
        setConfigError(getErrorMessage(error));
      } finally {
        setIsLoadingSelectedConfig(false);
      }
    },
    [syncSelectedConfig, token],
  );

  const refreshSavedConfigs = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoadingConfigs(true);
    setConfigError(null);

    try {
      const nextConfigs = await listCalculatorConfigs(token);
      setSavedConfigs(nextConfigs);

      if (nextConfigs.length === 0) {
        syncSelectedConfig(null);
        return;
      }

      if (
        selectedConfig &&
        nextConfigs.some((config) => config.id === selectedConfig.id)
      ) {
        return;
      }

      await loadSelectedConfig(nextConfigs[0].id);
    } catch (error) {
      setConfigError(getErrorMessage(error));
    } finally {
      setIsLoadingConfigs(false);
    }
  }, [loadSelectedConfig, selectedConfig, syncSelectedConfig, token]);

  useEffect(() => {
    if (!token) {
      setSavedConfigs([]);
      return;
    }

    void refreshSavedConfigs();
  }, [refreshSavedConfigs, token]);

  const effectiveConfig = useMemo(
    () =>
      selectedConfig
        ? {
            ...selectedConfig.config,
            ficaMode: deriveFicaMode(selectedConfig.config),
          }
        : null,
    [selectedConfig],
  );
  const months = useMemo(() => {
    if (!effectiveConfig) {
      return [];
    }

    return calculatePayroll(effectiveConfig).monthly.map((row) => ({
      key: row.startDate.slice(0, 7),
      label: formatMonthYear(row.startDate),
      netPay: row.netPay,
    }));
  }, [effectiveConfig]);

  useEffect(() => {
    saveStoredPlannerData({ expenses });
  }, [expenses]);

  useEffect(() => {
    const plannerId = searchParams.get("planner");
    if (!plannerId || !token) return;
    getPlannerDocument(token, plannerId)
      .then(({ plannerData }) => {
        setExpenses(plannerData.expenses);
        saveStoredPlannerData(plannerData);
      })
      .catch(() => {});
  }, [searchParams, token]);

  const monthTotalExpenses = (monthKey: string) =>
    expenses.reduce((sum, expense) => sum + getOverride(expense, monthKey), 0);

  const expenseTotal = (expense: PlannerExpense) =>
    months.reduce((sum, month) => sum + getOverride(expense, month.key), 0);

  const grandTotals = useMemo(() => {
    const netPay = months.reduce((sum, month) => sum + month.netPay, 0);
    const totalExpenses = expenses.reduce(
      (sum, expense) =>
        sum +
        months.reduce(
          (monthSum, month) => monthSum + getOverride(expense, month.key),
          0,
        ),
      0,
    );
    return {
      netPay,
      expenses: totalExpenses,
      savings: netPay - totalExpenses,
    };
  }, [months, expenses]);

  const trendsData = useMemo(
    () =>
      months.map((month) => {
        const expense = expenses.reduce(
          (sum, expenseItem) => sum + getOverride(expenseItem, month.key),
          0,
        );
        return {
          month: month.label,
          income: month.netPay,
          expense,
          savings: month.netPay - expense,
        };
      }),
    [months, expenses],
  );

  const breakdownData = useMemo(() => {
    const values = expenses.map((expense, index) => ({
      name: expense.name,
      value: months.reduce(
        (sum, month) => sum + getOverride(expense, month.key),
        0,
      ),
      fill: `var(--chart-${(index % 5) + 1})`,
    }));
    if (grandTotals.savings > 0) {
      values.push({
        name: "Savings",
        value: grandTotals.savings,
        fill: "var(--chart-2)",
      });
    }
    return values;
  }, [expenses, months, grandTotals.savings]);

  const addExpense = () => {
    const amount = Number(newExpenseAmount);
    if (!newExpenseName.trim() || !Number.isFinite(amount) || amount <= 0)
      return;
    setExpenses((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newExpenseName.trim(),
        defaultAmount: amount,
        overrides: {},
      },
    ]);
    setNewExpenseName("");
    setNewExpenseAmount("");
  };

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  };

  const setOverride = (expenseId: string, monthKey: string, value: string) => {
    setExpenses((prev) =>
      prev.map((expense) => {
        if (expense.id !== expenseId) return expense;
        const parsed = Number(value);
        if (!value || !Number.isFinite(parsed)) {
          const nextOverrides = { ...expense.overrides };
          delete nextOverrides[monthKey];
          return { ...expense, overrides: nextOverrides };
        }
        return {
          ...expense,
          overrides: { ...expense.overrides, [monthKey]: parsed },
        };
      }),
    );
  };

  const updateByPercentage = (expenseId: string, inputValue: string) => {
    const pct = Number(inputValue);
    if (
      !Number.isFinite(pct) ||
      pct < 0 ||
      months.length === 0 ||
      grandTotals.netPay <= 0
    )
      return;

    setExpenses((prev) =>
      prev.map((expense) => {
        if (expense.id !== expenseId) return expense;
        const nonOverriddenMonths = months.filter(
          (month) => expense.overrides[month.key] === undefined,
        );
        if (nonOverriddenMonths.length === 0) return expense;

        const overriddenSum = months.reduce(
          (sum, month) => sum + (expense.overrides[month.key] ?? 0),
          0,
        );
        const targetTotal = (pct / 100) * grandTotals.netPay;
        const newBase =
          (targetTotal - overriddenSum) / nonOverriddenMonths.length;
        return {
          ...expense,
          defaultAmount: Math.max(0, Number(newBase.toFixed(2))),
        };
      }),
    );
  };

  const handleLoadPlannerDocument = ({ plannerData }: SavedPlannerDocumentDetail) => {
    setExpenses(plannerData.expenses);
    saveStoredPlannerData(plannerData);
  };

  const handleConfigSelection = async (value: string) => {
    const nextConfigId = Number(value);

    if (!Number.isFinite(nextConfigId) || selectedConfig?.id === nextConfigId) {
      return;
    }

    await loadSelectedConfig(nextConfigId);
  };

  if (isAuthLoading || (token && isLoadingConfigs && savedConfigs.length === 0)) {
    return (
      <div className="bg-background text-foreground min-h-screen p-4 md:p-8">
        <div className="text-muted-foreground mx-auto flex max-w-3xl items-center gap-2 text-sm">
          <Spinner />
          Loading saved calculator configs...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return (
      <BudgetPlannerEmptyState
        title="Sign in to use the budget planner"
        description="Sign in first, then save a calculator config before building a planner."
      />
    );
  }

  if (savedConfigs.length === 0) {
    return (
      <BudgetPlannerEmptyState
        title="No saved calculator configs"
        description="Go back to the calculator, create a config, and save it before using the planner."
      />
    );
  }

  if (!selectedConfig || isLoadingSelectedConfig) {
    return (
      <div className="bg-background text-foreground min-h-screen p-4 md:p-8">
        <div className="text-muted-foreground mx-auto flex max-w-3xl items-center gap-2 text-sm">
          <Spinner />
          Loading the selected calculator config...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="mx-auto space-y-6 p-4 md:p-8">
        <BudgetPlannerHeader
          totalNetPay={grandTotals.netPay}
          savedPlansPanel={
            <div className="flex items-center gap-2">
              <Select
                value={selectedConfig ? String(selectedConfig.id) : undefined}
                onValueChange={handleConfigSelection}
                disabled={isLoadingSelectedConfig}
              >
                <SelectTrigger className="bg-background h-9 w-52 md:w-60">
                  <SelectValue placeholder="Choose calculator config" />
                </SelectTrigger>
                <SelectContent>
                  {savedConfigs.map((config) => (
                    <SelectItem key={config.id} value={String(config.id)}>
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <PlannerDocumentsPanel
                token={token}
                currentExpenses={expenses}
                onLoad={handleLoadPlannerDocument}
                compact
              />
            </div>
          }
          savedPlansHint={null}
        />

        {configError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{configError}</p>
        ) : null}

        <div className="space-y-6">
          <BudgetQuickAddExpenseCard
            expenseName={newExpenseName}
            expenseAmount={newExpenseAmount}
            onExpenseNameChange={setNewExpenseName}
            onExpenseAmountChange={setNewExpenseAmount}
            onAddExpense={addExpense}
          />

          <BudgetExpensesTable
            months={months}
            expenses={expenses}
            grandTotals={grandTotals}
            getOverride={getOverride}
            expenseTotal={expenseTotal}
            monthTotalExpenses={monthTotalExpenses}
            onSetOverride={setOverride}
            onUpdateByPercentage={updateByPercentage}
            onRemoveExpense={removeExpense}
          />

          <BudgetChartsSection
            trendsData={trendsData}
            breakdownData={breakdownData}
          />
        </div>
      </div>
    </div>
  );
}
