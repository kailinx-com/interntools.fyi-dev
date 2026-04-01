"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LockedPaycheckSectionProps = {
  children: ReactNode;
  locked: boolean;
  title?: string;
  description?: string;
  className?: string;
  contentClassName?: string;
  overlayClassName?: string;
  loginHref?: string;
};

export function LockedPaycheckSection({
  children,
  locked,
  title = "Log in to view this data",
  description = "Sign in to unlock detailed paycheck tables, charts, and planner data.",
  className,
  contentClassName,
  overlayClassName,
  loginHref = "/login",
}: LockedPaycheckSectionProps) {
  return (
    <div className={cn("relative", className)}>
      <div
        aria-hidden={locked}
        className={cn(
          contentClassName,
          locked && "pointer-events-none select-none opacity-85 blur-[2px]",
        )}
      >
        {children}
      </div>

      {locked ? (
        <div
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-background/15 p-6 text-center backdrop-blur-sm",
            overlayClassName,
          )}
        >
          <div className="max-w-sm space-y-3 rounded-2xl border bg-background/95 px-6 py-5 shadow-lg">
            <div className="bg-primary/10 text-primary mx-auto flex size-11 items-center justify-center rounded-full">
              <Lock className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
            <Button asChild>
              <Link href={loginHref}>Log in</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
