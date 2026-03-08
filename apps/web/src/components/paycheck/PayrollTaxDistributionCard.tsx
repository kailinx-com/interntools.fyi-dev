"use client";

import { Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const TAX_CHART_CONFIG = {
  netPay: { label: "Net Pay", color: "var(--chart-2)" },
  federal: { label: "Federal Tax", color: "var(--chart-1)" },
  state: { label: "State Tax", color: "var(--chart-3)" },
  fica: { label: "FICA", color: "var(--chart-4)" },
  sdi: { label: "SDI", color: "var(--chart-5)" },
};

type TaxPieDataItem = {
  bucket: string;
  value: number;
  fill: string;
};

type PayrollTaxDistributionCardProps = {
  taxPieData: TaxPieDataItem[];
};

export function PayrollTaxDistributionCard({
  taxPieData,
}: PayrollTaxDistributionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tax Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={TAX_CHART_CONFIG} className="h-80 w-full">
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="bucket" labelKey="bucket" />}
            />
            <Pie data={taxPieData} dataKey="value" nameKey="bucket" innerRadius={68} />
            <ChartLegend content={<ChartLegendContent nameKey="bucket" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
