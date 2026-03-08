import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { BudgetPlanner } from "@/components/paycheck";

export const metadata: Metadata = {
  title: "Budget Planner | interntools.fyi",
  description:
    "Plan monthly expenses against projected net pay and visualize savings trends.",
};

export default function BudgetPlannerPage() {
  return (
    <PageShell>
      <Suspense
        fallback={
          <div className="mx-auto max-w-4xl px-4 py-12 text-sm text-muted-foreground">
            Loading planner...
          </div>
        }
      >
        <BudgetPlanner />
      </Suspense>
    </PageShell>
  );
}
