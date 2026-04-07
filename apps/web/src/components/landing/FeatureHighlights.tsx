import Link from "next/link";
import {
  ArrowLeftRight,
  Calculator,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
}

export interface FeatureHighlightsProps {
  title?: string;
  features?: FeatureItem[];
  className?: string;
}

const defaultFeatures: FeatureItem[] = [
  {
    icon: Calculator,
    title: "Paycheck Calculator",
    description:
      "Estimate take-home pay for any state, pay period, and filing status — no surprises on payday.",
    href: "/calculator",
  },
  {
    icon: ArrowLeftRight,
    title: "Compare Offers Side-by-Side",
    description:
      "Stack up internship offers with real financials — pay, expenses, commute — and save your analysis.",
    href: "/offers/compare",
  },
  {
    icon: Users,
    title: "Community Feed",
    description:
      "Browse offer outcomes and advice posted by other interns and students making the same decisions.",
    href: "/offers",
  },
];

export function FeatureHighlights({
  title = "Why use interntools?",
  features = defaultFeatures,
  className,
}: FeatureHighlightsProps) {
  return (
    <section
      className={cn(
        "py-16 bg-card dark:bg-neutral-surface-dark border-y border-border",
        className,
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">{title}</h2>
        </div>
        <div className="grid grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            const card = (
              <div className="text-center p-4 h-full">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="size-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );

            return feature.href ? (
              <Link
                key={feature.title}
                href={feature.href}
                className="group rounded-xl hover:bg-accent transition-colors"
              >
                {card}
              </Link>
            ) : (
              <div key={feature.title}>{card}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
