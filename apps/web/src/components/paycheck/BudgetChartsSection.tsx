"use client";

import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const TRENDS_CHART_CONFIG = {
  income: { label: "Net Income", color: "var(--chart-2)" },
  expense: { label: "Expenses", color: "var(--chart-1)" },
  savings: { label: "Savings", color: "var(--chart-3)" },
};

const BREAKDOWN_CHART_CONFIG = {
  value: { label: "Amount", color: "var(--chart-4)" },
};

type TrendsDataItem = {
  month: string;
  income: number;
  expense: number;
  savings: number;
};

type BreakdownDataItem = {
  name: string;
  value: number;
  fill: string;
};

type BudgetChartsSectionProps = {
  trendsData: TrendsDataItem[];
  breakdownData: BreakdownDataItem[];
};

export function BudgetChartsSection({
  trendsData,
  breakdownData,
}: BudgetChartsSectionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cash Flow Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={TRENDS_CHART_CONFIG} className="h-80 w-full">
            <BarChart data={trendsData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="income" fill="var(--color-income)" radius={4} />
              <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
              <Bar dataKey="savings" fill="var(--color-savings)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spending Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={BREAKDOWN_CHART_CONFIG} className="h-80 w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie data={breakdownData} dataKey="value" nameKey="name" innerRadius={68} />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
