"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const HISTORY_CHART_CONFIG = {
  net: { label: "Net Pay", color: "var(--chart-2)" },
  taxes: { label: "Taxes", color: "var(--chart-1)" },
};

type HistoryDataItem = {
  period: string;
  net: number;
  taxes: number;
};

type PayrollTrendsCardProps = {
  historyData: HistoryDataItem[];
};

export function PayrollTrendsCard({ historyData }: PayrollTrendsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pay Period Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={HISTORY_CHART_CONFIG} className="h-80 w-full">
          <BarChart data={historyData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="period" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="net" fill="var(--color-net)" stackId="a" radius={4} />
            <Bar dataKey="taxes" fill="var(--color-taxes)" stackId="a" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
