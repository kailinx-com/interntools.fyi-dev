"use client";

import Link from "next/link";
import { ArrowRight, Calculator, GitCompare, PieChart, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickTool {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
}

export interface TrendingCitiesWidgetProps {
  title?: string;
  tools?: QuickTool[];
  className?: string;
}

const defaultTools: QuickTool[] = [
  {
    icon: <Calculator className="size-4 text-primary" />,
    label: "Paycheck Calculator",
    description: "Estimate take-home pay",
    href: "/calculator",
  },
  {
    icon: <PieChart className="size-4 text-primary" />,
    label: "Paycheck Planner",
    description: "Budget vs net income",
    href: "/calculator/planner",
  },
  {
    icon: <GitCompare className="size-4 text-primary" />,
    label: "Compare Offers",
    description: "Side-by-side analysis",
    href: "/offers/compare",
  },
  {
    icon: <FileText className="size-4 text-primary" />,
    label: "Post an Update",
    description: "Share your offer outcome",
    href: "/offers/submit",
  },
];

export function TrendingCitiesWidget({
  title = "Quick Tools",
  tools = defaultTools,
  className,
}: TrendingCitiesWidgetProps) {
  return (
    <div
      className={cn(
        "bg-card dark:bg-neutral-surface-dark rounded-xl p-6 border border-border shadow-sm",
        className,
      )}
    >
      <h3 className="font-bold text-foreground mb-4">{title}</h3>
      <div className="space-y-1">
        {tools.map((tool) => (
          <Link
            key={tool.label}
            href={tool.href}
            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-accent transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                {tool.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground leading-tight">{tool.label}</p>
                <p className="text-xs text-muted-foreground">{tool.description}</p>
              </div>
            </div>
            <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
