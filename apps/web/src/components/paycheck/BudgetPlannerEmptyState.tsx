"use client";

import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type BudgetPlannerEmptyStateProps = {
  title: string;
  description: string;
};

export function BudgetPlannerEmptyState({
  title,
  description,
}: BudgetPlannerEmptyStateProps) {
  return (
    <div className="bg-background text-foreground min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Alert>
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>{description}</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/calculator">Go to calculator</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
