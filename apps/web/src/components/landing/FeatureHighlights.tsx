import {
  ShieldCheck,
  Calculator,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface FeatureHighlightsProps {
  title?: string;
  features?: FeatureItem[];
  className?: string;
}

const defaultFeatures: FeatureItem[] = [
  {
    icon: ShieldCheck,
    title: "Decision-ready comparisons",
    description:
      "Combine pay, rent, commute, and notes so headline salary is not the only number that matters.",
  },
  {
    icon: Calculator,
    title: "Accurate Estimates",
    description:
      "Our paycheck calculator uses real-time tax data for all 50 states.",
  },
  {
    icon: Users,
    title: "Student Community",
    description:
      "Join thousands of students helping each other navigate their career start.",
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
          <h2 className="text-3xl font-bold text-foreground">
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="text-center p-4">
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
          })}
        </div>
      </div>
    </section>
  );
}
