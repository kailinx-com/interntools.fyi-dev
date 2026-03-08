"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/paycheck";

type BudgetPlannerHeaderProps = {
  totalNetPay: number;
  onReset: () => void;
};

export function BudgetPlannerHeader({
  totalNetPay,
  onReset,
}: BudgetPlannerHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon">
          <Link href="/calculator">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budget Planner</h1>
          <p className="text-muted-foreground text-sm">Plan monthly expenses and savings</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-muted-foreground text-xs uppercase">Total Net Pay</div>
          <div className="text-xl font-bold text-emerald-500">
            ${formatMoney(totalNetPay, 0)}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onReset} aria-label="Reset planner data">
          <RefreshCcw className="size-4" />
        </Button>
      </div>
    </header>
  );
}
