"use client";

import { ArrowRight, Calculator, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";

type PayrollHeaderProps = {
  onGoToPlanner: () => void;
};

export function PayrollHeader({ onGoToPlanner }: PayrollHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/15 rounded-xl p-2">
          <Calculator className="text-primary size-6" />
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Payroll Estimation & Planning</p>
        </div>
      </div>
      <Button onClick={onGoToPlanner} variant="secondary" className="gap-2">
        <Wallet className="size-4" />
        Budget Planner
        <ArrowRight className="size-4" />
      </Button>
    </header>
  );
}
