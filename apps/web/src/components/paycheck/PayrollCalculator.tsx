"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { PayrollConfigurationCard } from "@/components/paycheck/PayrollConfigurationCard";
import { PayrollDetailedReceiptCard } from "@/components/paycheck/PayrollDetailedReceiptCard";
import { PayrollHeader } from "@/components/paycheck/PayrollHeader";
import { PayrollPeriodsTable } from "@/components/paycheck/PayrollPeriodsTable";
import { PayrollScenarioPanel } from "@/components/paycheck/PayrollScenarioPanel";
import { PayrollSummaryCards } from "@/components/paycheck/PayrollSummaryCards";
import { PayrollTaxDistributionCard } from "@/components/paycheck/PayrollTaxDistributionCard";
import { PayrollTrendsCard } from "@/components/paycheck/PayrollTrendsCard";
import {
  calculatePayroll,
  DEFAULT_PAYCHECK_CONFIG,
  deriveFicaMode,
  formatShortDate,
  type PaycheckConfig,
  type PeriodType,
  STATE_TAX_DATA,
} from "@/lib/paycheck";

export function PayrollCalculator() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<PeriodType>("weekly");
  const [config, setConfig] = useState<PaycheckConfig>(DEFAULT_PAYCHECK_CONFIG);

  const ficaMode = useMemo(() => deriveFicaMode(config), [config]);
  const payroll = useMemo(
    () => calculatePayroll({ ...config, ficaMode }),
    [config, ficaMode],
  );
  const activeRows = payroll[activeTab];

  const totals = useMemo(
    () =>
      activeRows.reduce(
        (acc, row) => {
          acc.gross += row.grossTotal;
          acc.fed += row.taxFederal;
          acc.state += row.taxState;
          acc.fica += row.taxFica;
          acc.net += row.netPay;
          return acc;
        },
        { gross: 0, fed: 0, state: 0, fica: 0, net: 0 },
      ),
    [activeRows],
  );

  const breakdown = useMemo(
    () =>
      [
        {
          key: "federal",
          label: "Federal Tax",
          value: payroll.summary.totalFed,
        },
        {
          key: "state",
          label: "State Tax",
          value: payroll.summary.totalState,
        },
        {
          key: "fica",
          label: "FICA (SS + Medicare)",
          value: payroll.summary.totalFica,
        },
        {
          key: "sdi",
          label: "SDI / Disability",
          value: payroll.summary.totalSdi,
        },
      ].sort((a, b) => b.value - a.value),
    [payroll.summary],
  );

  const taxPieData = useMemo(
    () =>
      [
        {
          bucket: "netPay",
          value: payroll.summary.netTotal,
          fill: "var(--color-netPay)",
        },
        {
          bucket: "federal",
          value: payroll.summary.totalFed,
          fill: "var(--color-federal)",
        },
        {
          bucket: "state",
          value: payroll.summary.totalState,
          fill: "var(--color-state)",
        },
        {
          bucket: "fica",
          value: payroll.summary.totalFica,
          fill: "var(--color-fica)",
        },
        {
          bucket: "sdi",
          value: payroll.summary.totalSdi,
          fill: "var(--color-sdi)",
        },
      ].filter((item) => item.value > 0.01),
    [payroll.summary],
  );

  const historyData = useMemo(
    () =>
      activeRows.map((row) => ({
        period: formatShortDate(row.startDate),
        net: row.netPay,
        taxes: row.grossTotal - row.netPay,
      })),
    [activeRows],
  );

  const states = useMemo(
    () =>
      Object.entries(STATE_TAX_DATA)
        .map(([value, data]) => ({ value, label: data.n }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );

  const setConfigValue = <K extends keyof PaycheckConfig>(
    key: K,
    value: PaycheckConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const goToPlanner = () => {
    const serializedMonthly = encodeURIComponent(
      JSON.stringify(payroll.monthly),
    );
    router.push(`/calculator/planner?monthly=${serializedMonthly}`);
  };

  const handleLoadScenario = (nextConfig: PaycheckConfig) => {
    setConfig(nextConfig);
  };

  const downloadCsv = () => {
    const rows = payroll[activeTab];
    const header = "Period,Start,End,Gross,FedTax,StateTax,FICA,SDI,NetPay\n";
    const body = rows
      .map(
        (row) =>
          `${row.label},${row.startDate},${row.endDate},${row.grossTotal.toFixed(2)},${row.taxFederal.toFixed(2)},${row.taxState.toFixed(2)},${row.taxFica.toFixed(2)},${row.taxSdi.toFixed(2)},${row.netPay.toFixed(2)}`,
      )
      .join("\n");
    const blob = new Blob([`${header}${body}`], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll_${activeTab}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="mx-auto max-w-400 space-y-6 p-4 md:p-8">
        <PayrollHeader
          onGoToPlanner={goToPlanner}
          savePanel={
            token ? (
              <PayrollScenarioPanel
                token={token}
                currentConfig={{ ...config, ficaMode }}
                onLoad={handleLoadScenario}
              />
            ) : undefined
          }
          saveHint={
            !isAuthLoading && !isAuthenticated
              ? "Sign in to save calculator scenarios."
              : null
          }
        />

        <div className="grid items-start gap-6 lg:grid-cols-[380px_1fr]">
          <PayrollConfigurationCard
            config={config}
            states={states}
            ficaMode={ficaMode}
            onConfigChange={setConfigValue}
          />

          <div className="space-y-6">
            <PayrollSummaryCards
              totalGross={payroll.summary.totalGross}
              totalDeductions={payroll.summary.totalDeductions}
              netTotal={payroll.summary.netTotal}
            />

            <PayrollPeriodsTable
              activeTab={activeTab}
              rows={activeRows}
              totals={totals}
              onTabChange={setActiveTab}
              onExportCsv={downloadCsv}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <PayrollTaxDistributionCard taxPieData={taxPieData} />
              <PayrollDetailedReceiptCard
                breakdown={breakdown}
                totalGross={payroll.summary.totalGross}
                netTotal={payroll.summary.netTotal}
              />
            </div>

            <PayrollTrendsCard historyData={historyData} />
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          Disclaimer: This calculator is for informational purposes only and is
          not legal, tax, or financial advice.
        </div>
      </div>
    </div>
  );
}
