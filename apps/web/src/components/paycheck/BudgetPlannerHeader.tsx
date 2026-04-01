"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/paycheck";

type BudgetPlannerHeaderProps = {
  totalNetPay: number;
  savedPlansPanel?: ReactNode;
  savedPlansHint?: string | null;
};

export function BudgetPlannerHeader({
  totalNetPay,
  savedPlansPanel,
  savedPlansHint,
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
          <p className="text-muted-foreground text-sm">
            Plan monthly expenses against your saved paycheck setup
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {savedPlansPanel}
        <div className="text-left sm:text-right">
          <div className="text-muted-foreground text-xs uppercase">Total Net Pay</div>
          <div className="text-xl leading-none font-bold text-emerald-500">
            ${formatMoney(totalNetPay, 0)}
          </div>
        </div>
        {savedPlansHint ? (
          <p className="text-muted-foreground text-sm">{savedPlansHint}</p>
        ) : null}
      </div>
    </header>
  );
}
