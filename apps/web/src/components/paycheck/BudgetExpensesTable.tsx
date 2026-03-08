"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/paycheck";

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

type GrandTotals = {
  netPay: number;
  expenses: number;
  savings: number;
};

type BudgetExpensesTableProps = {
  months: MonthNet[];
  expenses: Expense[];
  grandTotals: GrandTotals;
  getOverride: (expense: Expense, monthKey: string) => number;
  expenseTotal: (expense: Expense) => number;
  monthTotalExpenses: (monthKey: string) => number;
  onSetOverride: (expenseId: string, monthKey: string, value: string) => void;
  onUpdateByPercentage: (expenseId: string, value: string) => void;
  onRemoveExpense: (expenseId: string) => void;
};

export function BudgetExpensesTable({
  months,
  expenses,
  grandTotals,
  getOverride,
  expenseTotal,
  monthTotalExpenses,
  onSetOverride,
  onUpdateByPercentage,
  onRemoveExpense,
}: BudgetExpensesTableProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              {months.map((month) => (
                <TableHead key={month.key} className="text-right">
                  {month.label}
                </TableHead>
              ))}
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">% of Net</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-semibold text-emerald-500">
                Net Income
              </TableCell>
              {months.map((month) => (
                <TableCell
                  key={month.key}
                  className="text-right font-medium text-emerald-500"
                >
                  ${formatMoney(month.netPay, 0)}
                </TableCell>
              ))}
              <TableCell className="bg-emerald-500/10 text-right font-bold text-emerald-500">
                ${formatMoney(grandTotals.netPay, 0)}
              </TableCell>
              <TableCell className="text-right font-bold text-emerald-500">
                100%
              </TableCell>
              <TableCell />
            </TableRow>

            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  <div className="font-medium">{expense.name}</div>
                  <div className="text-muted-foreground text-xs">
                    Monthly base: ${formatMoney(expense.defaultAmount)}
                  </div>
                </TableCell>
                {months.map((month) => (
                  <TableCell key={month.key}>
                    <Input
                      type="number"
                      value={getOverride(expense, month.key)}
                      onChange={(event) =>
                        onSetOverride(expense.id, month.key, event.target.value)
                      }
                      className="text-right"
                    />
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold">
                  ${formatMoney(expenseTotal(expense), 0)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      className="pr-6 text-right"
                      value={
                        grandTotals.netPay > 0
                          ? (
                              (expenseTotal(expense) / grandTotals.netPay) *
                              100
                            ).toFixed(1)
                          : "0.0"
                      }
                      onChange={(event) =>
                        onUpdateByPercentage(expense.id, event.target.value)
                      }
                    />
                    <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs">
                      %
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveExpense(expense.id)}
                    aria-label={`Delete ${expense.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total Expenses</TableCell>
              {months.map((month) => (
                <TableCell key={month.key} className="text-right text-rose-500">
                  ${formatMoney(monthTotalExpenses(month.key), 0)}
                </TableCell>
              ))}
              <TableCell className="text-right text-rose-500">
                ${formatMoney(grandTotals.expenses, 0)}
              </TableCell>
              <TableCell className="text-right text-rose-500">
                {grandTotals.netPay > 0
                  ? `${((grandTotals.expenses / grandTotals.netPay) * 100).toFixed(1)}%`
                  : "0.0%"}
              </TableCell>
              <TableCell />
            </TableRow>
            <TableRow>
              <TableCell>Savings</TableCell>
              {months.map((month) => {
                const savings = month.netPay - monthTotalExpenses(month.key);
                return (
                  <TableCell
                    key={month.key}
                    className={`text-right ${savings >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                  >
                    ${formatMoney(savings, 0)}
                  </TableCell>
                );
              })}
              <TableCell className="bg-emerald-500/10 text-right text-emerald-500">
                ${formatMoney(grandTotals.savings, 0)}
              </TableCell>
              <TableCell className="text-right text-emerald-500">
                {grandTotals.netPay > 0
                  ? `${((grandTotals.savings / grandTotals.netPay) * 100).toFixed(1)}%`
                  : "0.0%"}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
