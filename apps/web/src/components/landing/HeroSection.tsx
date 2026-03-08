import Link from "next/link";
import { Home, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HeroCta {
  title: string;
  description: string;
  href: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary";
}

export interface HeroSectionProps {
  badge?: string;
  headline?: string;
  headlineHighlight?: string;
  subtext?: string;
  ctas?: HeroCta[];
  className?: string;
}

const defaultCtas: HeroCta[] = [
  {
    title: "Search Housing",
    description: "Find sublets & roommates",
    href: "/housing",
    icon: <Home className="size-8 text-primary mb-3" />,
    variant: "primary",
  },
  {
    title: "Estimate Paycheck",
    description: "Calculate tax & take-home",
    href: "/calculator",
    icon: <Banknote className="size-8 text-primary mb-3" />,
    variant: "secondary",
  },
];

export function HeroSection({
  badge = "Updated for Summer 2026",
  headline = "Find your place.",
  headlineHighlight = "Know your worth.",
  subtext = "The ultimate toolkit for U.S. interns. Connect with safe housing options and get transparent paycheck estimates in seconds.",
  ctas = defaultCtas,
  className,
}: HeroSectionProps) {
  return (
    <section
      className={cn(
        "relative pt-24 pb-28 lg:pt-32 lg:pb-32 overflow-hidden",
        className,
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
        {badge && (
          <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {badge}
          </span>
        )}

        <h1 className="text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6">
          {headline}
          <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-emerald-600">
            {headlineHighlight}
          </span>
        </h1>

        {subtext && (
          <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground mb-10 leading-relaxed">
            {subtext}
          </p>
        )}

        {/* Hero CTAs */}
        <div className="flex flex-row justify-center items-center gap-4 max-w-lg mx-auto">
          {ctas.map((cta) => {
            return (
              <Link
                key={cta.title}
                href={cta.href}
                className={cn(
                  "group w-1/2 rounded-xl shadow-lg hover:shadow-xl transition-all border border-border",
                  "bg-white dark:bg-neutral-surface-dark p-1",
                )}
              >
                <div
                  className={cn(
                    "rounded-lg p-6 h-full flex flex-col items-center justify-center text-center transition-colors",
                    "bg-primary/5 dark:bg-primary/10 group-hover:bg-secondary dark:group-hover:bg-primary-foreground",
                  )}
                >
                  {cta.icon}
                  <span className="font-bold text-foreground mb-1">
                    {cta.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {cta.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
