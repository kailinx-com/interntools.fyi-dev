"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BudgetChartsSection } from "@/components/paycheck/BudgetChartsSection";
import { BudgetExpensesTable } from "@/components/paycheck/BudgetExpensesTable";
import { BudgetPlannerEmptyState } from "@/components/paycheck/BudgetPlannerEmptyState";
import { BudgetPlannerHeader } from "@/components/paycheck/BudgetPlannerHeader";
import { BudgetQuickAddExpenseCard } from "@/components/paycheck/BudgetQuickAddExpenseCard";
import { type PeriodRow } from "@/lib/paycheck";
import { formatMonthYear } from "@/lib/paycheck-format";

type MonthNet = {
  key: string;
  label: string;
  netPay: number;
};

type Expense = {
  id: string;
  name: string;
  defaultAmount: number;
  overrides: Record<string, number>;
};

function monthKeyFromIso(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function monthLabelFromIso(isoDate: string): string {
  return formatMonthYear(isoDate);
}

function getOverride(expense: Expense, monthKey: string): number {
  return expense.overrides[monthKey] ?? expense.defaultAmount;
}

export function BudgetPlanner() {
  const searchParams = useSearchParams();
  const months = useMemo<MonthNet[]>(() => {
    try {
      const rawMonthly = searchParams.get("monthly");
      if (!rawMonthly) return [];
      const monthlyRows = JSON.parse(
        decodeURIComponent(rawMonthly),
      ) as PeriodRow[];
      return monthlyRows.map((row) => ({
        key: monthKeyFromIso(row.startDate),
        label: monthLabelFromIso(row.startDate),
        netPay: row.netPay,
      }));
    } catch {
      return [];
    }
  }, [searchParams]);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");

  const monthTotalExpenses = (monthKey: string) =>
    expenses.reduce((sum, expense) => sum + getOverride(expense, monthKey), 0);

  const expenseTotal = (expense: Expense) =>
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

  const resetData = () => {
    if (!window.confirm("Clear all budget items?")) return;
    setExpenses([]);
  };

  if (months.length === 0) {
    return <BudgetPlannerEmptyState />;
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="mx-auto space-y-6 p-4 md:p-8">
        <BudgetPlannerHeader
          totalNetPay={grandTotals.netPay}
          onReset={resetData}
        />

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
  );
}
