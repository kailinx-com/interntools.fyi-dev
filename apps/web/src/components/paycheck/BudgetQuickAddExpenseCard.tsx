"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BudgetQuickAddExpenseCardProps = {
  expenseName: string;
  expenseAmount: string;
  onExpenseNameChange: (value: string) => void;
  onExpenseAmountChange: (value: string) => void;
  onAddExpense: () => void;
};

export function BudgetQuickAddExpenseCard({
  expenseName,
  expenseAmount,
  onExpenseNameChange,
  onExpenseAmountChange,
  onAddExpense,
}: BudgetQuickAddExpenseCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Expense</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="w-full space-y-2">
          <Label htmlFor="expense-name">Expense Name</Label>
          <Input
            id="expense-name"
            placeholder="e.g. Rent, Groceries, Gym"
            value={expenseName}
            onChange={(event) => onExpenseNameChange(event.target.value)}
          />
        </div>
        <div className="w-full space-y-2 md:w-2xl">
          <Label htmlFor="expense-amount">Monthly Amount ($)</Label>
          <Input
            id="expense-amount"
            type="number"
            placeholder="0.00"
            value={expenseAmount}
            onChange={(event) => onExpenseAmountChange(event.target.value)}
          />
        </div>
        <Button className="gap-2" onClick={onAddExpense}>
          <Plus className="size-4" />
          Add Category
        </Button>
      </CardContent>
    </Card>
  );
}
