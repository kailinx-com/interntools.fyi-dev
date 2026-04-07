"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { LockedPaycheckSection } from "@/components/paycheck/LockedPaycheckSection";
import { PayrollConfigurationCard } from "@/components/paycheck/PayrollConfigurationCard";
import { PayrollDetailedReceiptCard } from "@/components/paycheck/PayrollDetailedReceiptCard";
import { PayrollHeader } from "@/components/paycheck/PayrollHeader";
import { PayrollPeriodsTable } from "@/components/paycheck/PayrollPeriodsTable";
import { SavedCalculatorConfigsPanel } from "@/components/paycheck/SavedCalculatorConfigsPanel";
import { PayrollSummaryCards } from "@/components/paycheck/PayrollSummaryCards";
import { PayrollTaxDistributionCard } from "@/components/paycheck/PayrollTaxDistributionCard";
import { PayrollTrendsCard } from "@/components/paycheck/PayrollTrendsCard";
import {
  getStoredPaycheckConfig,
  saveStoredPaycheckConfig,
} from "@/lib/paycheck/draft";
import {
  calculatePayroll,
  DEFAULT_PAYCHECK_CONFIG,
  deriveFicaMode,
  formatShortDate,
  type PaycheckConfig,
  type PeriodType,
  STATE_TAX_DATA,
} from "@/lib/paycheck";
import { getCalculatorConfig, type SavedCalculatorConfigDetail } from "@/lib/paycheck/api";

export function PayrollCalculator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const isDetailLocked = !isAuthLoading && !isAuthenticated;
  const [activeTab, setActiveTab] = useState<PeriodType>("weekly");
  const [config, setConfig] = useState<PaycheckConfig>(
    () => getStoredPaycheckConfig() ?? DEFAULT_PAYCHECK_CONFIG,
  );

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

  useEffect(() => {
    saveStoredPaycheckConfig({ ...config, ficaMode });
  }, [config, ficaMode]);

  useEffect(() => {
    const scenarioId = searchParams.get("scenario");
    if (!scenarioId || !token) return;
    getCalculatorConfig(token, Number(scenarioId))
      .then(({ config: nextConfig }) => {
        setConfig(nextConfig);
        saveStoredPaycheckConfig(nextConfig);
      })
      .catch(() => {});
  }, [searchParams, token]);

  const goToPlanner = () => {
    saveStoredPaycheckConfig({ ...config, ficaMode });
    router.push("/calculator/planner");
  };

  const handleLoadConfig = ({
    config: nextConfig,
  }: SavedCalculatorConfigDetail) => {
    setConfig(nextConfig);
    saveStoredPaycheckConfig(nextConfig);
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
      <div className="mx-auto space-y-6 p-4 md:p-8">
        <PayrollHeader onGoToPlanner={goToPlanner} />

        <div className="grid items-start gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <PayrollConfigurationCard
            config={config}
            states={states}
            ficaMode={ficaMode}
            onConfigChange={setConfigValue}
            savedPlansPanel={
              token ? (
                <SavedCalculatorConfigsPanel
                  token={token}
                  currentConfig={{ ...config, ficaMode }}
                  onLoad={handleLoadConfig}
                  manageButtonLabel="Manage configs"
                />
              ) : undefined
            }
            savedPlansHint={
              !isAuthLoading && !isAuthenticated
                ? "Sign in to save complete paycheck plans."
                : null
            }
          />

          <div className="space-y-6">
            <PayrollSummaryCards
              totalGross={payroll.summary.totalGross}
              totalDeductions={payroll.summary.totalDeductions}
              netTotal={payroll.summary.netTotal}
            />

            <LockedPaycheckSection
              locked={isDetailLocked}
              title="Log in to view paycheck details"
              description="Sign in to unlock period tables, tax breakdowns, and payroll trend charts."
              className="rounded-3xl"
              contentClassName="space-y-6"
              overlayClassName="items-start pt-8"
            >
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
            </LockedPaycheckSection>
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
