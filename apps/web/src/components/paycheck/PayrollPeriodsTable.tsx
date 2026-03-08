"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatMoney,
  formatShortDate,
  type PeriodRow,
  type PeriodType,
} from "@/lib/paycheck";

type PeriodTotals = {
  gross: number;
  fed: number;
  state: number;
  fica: number;
  net: number;
};

type PayrollPeriodsTableProps = {
  activeTab: PeriodType;
  rows: PeriodRow[];
  totals: PeriodTotals;
  onTabChange: (value: PeriodType) => void;
  onExportCsv: () => void;
};

export function PayrollPeriodsTable({
  activeTab,
  rows,
  totals,
  onTabChange,
  onExportCsv,
}: PayrollPeriodsTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as PeriodType)}>
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="biweekly">Biweekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="ghost" size="sm" className="gap-2" onClick={onExportCsv}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Fed Tax</TableHead>
              <TableHead className="text-right">State</TableHead>
              <TableHead className="text-right">FICA</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatShortDate(row.startDate)} - {formatShortDate(row.endDate)}
                </TableCell>
                <TableCell className="text-right">${formatMoney(row.grossTotal, 0)}</TableCell>
                <TableCell className="text-right text-red-500/80">
                  ${formatMoney(row.taxFederal, 0)}
                </TableCell>
                <TableCell className="text-right text-amber-500/80">
                  ${formatMoney(row.taxState, 0)}
                </TableCell>
                <TableCell className="text-right text-blue-500/80">
                  ${formatMoney(row.taxFica, 0)}
                </TableCell>
                <TableCell className="text-right font-bold text-emerald-500">
                  ${formatMoney(row.netPay, 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Total Period</TableCell>
              <TableCell className="text-right">${formatMoney(totals.gross, 0)}</TableCell>
              <TableCell className="text-right text-red-500/80">
                ${formatMoney(totals.fed, 0)}
              </TableCell>
              <TableCell className="text-right text-amber-500/80">
                ${formatMoney(totals.state, 0)}
              </TableCell>
              <TableCell className="text-right text-blue-500/80">
                ${formatMoney(totals.fica, 0)}
              </TableCell>
              <TableCell className="text-right text-emerald-500">
                ${formatMoney(totals.net, 0)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
