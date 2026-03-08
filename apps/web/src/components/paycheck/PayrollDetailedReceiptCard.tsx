"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/paycheck";

type BreakdownItem = {
  key: string;
  label: string;
  value: number;
};

type PayrollDetailedReceiptCardProps = {
  breakdown: BreakdownItem[];
  totalGross: number;
  netTotal: number;
};

export function PayrollDetailedReceiptCard({
  breakdown,
  totalGross,
  netTotal,
}: PayrollDetailedReceiptCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detailed Receipt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {breakdown.map((item) => {
          const pct = totalGross > 0 ? (item.value / totalGross) * 100 : 0;
          return (
            <div key={item.key} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">-${formatMoney(item.value)}</span>
              </div>
              <div className="bg-muted h-2 rounded-full">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                />
              </div>
            </div>
          );
        })}
        <div className="border-t pt-3">
          <div className="mb-1 flex items-center justify-between font-semibold text-emerald-500">
            <span>Net Take-Home Pay</span>
            <span>${formatMoney(netTotal)}</span>
          </div>
          <div className="bg-emerald-500/20 h-2 rounded-full">
            <div
              className="h-2 rounded-full bg-emerald-500"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    totalGross > 0 ? (netTotal / totalGross) * 100 : 0,
                  ),
                )}%`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
