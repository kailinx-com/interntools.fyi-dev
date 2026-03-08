"use client";

import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function BudgetPlannerEmptyState() {
  return (
    <div className="bg-background text-foreground min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Alert>
          <AlertTitle>No monthly payroll data found</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>Run the paycheck calculator first, then open planner.</p>
            <Button asChild size="sm">
              <Link href="/calculator">Go to calculator</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
