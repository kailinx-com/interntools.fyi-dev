"use client";

import { DollarSign, PieChartIcon, Wallet } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/paycheck";

type PayrollSummaryCardsProps = {
  totalGross: number;
  totalDeductions: number;
  netTotal: number;
};

export function PayrollSummaryCards({
  totalGross,
  totalDeductions,
  netTotal,
}: PayrollSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="flex flex-col py-4">
        <CardContent className="flex min-h-0 flex-1 flex-col items-center justify-center py-3 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="text-muted-foreground text-sm">Gross Pay</span>
            <DollarSign className="text-muted-foreground size-4" />
          </div>
          <div className="text-2xl font-bold">
            ${formatMoney(totalGross, 0)}
          </div>
        </CardContent>
      </Card>
      <Card className="flex flex-col py-4">
        <CardContent className="flex min-h-0 flex-1 flex-col items-center justify-center py-3 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="text-muted-foreground text-sm">
              Total Deductions
            </span>
            <PieChartIcon className="text-muted-foreground size-4" />
          </div>
          <div className="text-2xl font-bold text-red-500">
            -${formatMoney(totalDeductions, 0)}
          </div>
        </CardContent>
      </Card>
      <Card className="flex flex-col py-4">
        <CardContent className="flex min-h-0 flex-1 flex-col items-center justify-center py-3 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="text-muted-foreground text-sm">Net Take-Home</span>
            <Wallet className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-500">
            ${formatMoney(netTotal, 0)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
