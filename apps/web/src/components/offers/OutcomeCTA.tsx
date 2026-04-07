"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";

export function OutcomeCTA() {
  const { isAuthenticated } = useAuth();

  return (
    <Card className="bg-muted rounded-lg border-0 shadow-none">
      <CardContent className="flex h-full flex-col justify-between gap-4">
        <h2 className="text-l leading-tight font-semibold lg:text-l">
          Share your outcome
        </h2>
        <div>
          <p className="text-sm opacity-90 mb-4">
            Help the community by sharing your recent internship offer details
            anonymously.
          </p>
          <Link
            href={
              isAuthenticated
                ? "/offers/submit"
                : "/login?redirect=/offers/submit"
            }
          >
            <Button
              size="lg"
              className={cn(
                "w-full py-2 font-bold rounded-lg text-sm",
                "bg-primary/5 dark:bg-primary/10 text-primary",
                "hover:bg-primary dark:hover:bg-secondary-foreground dark:hover:text-secondary",
                "border-border",
              )}
            >
              Post an Update
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
