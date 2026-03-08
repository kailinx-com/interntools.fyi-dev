import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { PayrollCalculator } from "@/components/paycheck";

export const metadata: Metadata = {
  title: "Paycheck Calculator | interntools.fyi",
  description:
    "Estimate gross pay, taxes, deductions, and take-home pay across weekly, biweekly, and monthly views.",
};

export default function PaycheckCalculatorPage() {
  return (
    <PageShell>
      <PayrollCalculator />
    </PageShell>
  );
}
