import Link from "next/link";
import { ArrowRight, Calculator, GitCompare } from "lucide-react";
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
  feedHref?: string;
  className?: string;
}

const defaultCtas: HeroCta[] = [
  {
    title: "Paycheck Calculator",
    description: "Tax & take-home by pay period",
    href: "/calculator",
    icon: <Calculator className="size-8 text-primary mb-3" />,
    variant: "primary",
  },
  {
    title: "Compare Offers",
    description: "Side-by-side offer analysis",
    href: "/offers/compare",
    icon: <GitCompare className="size-8 text-primary mb-3" />,
    variant: "secondary",
  },
];

export function HeroSection({
  badge = "Paycheck tools & offer comparison",
  headline = "Know your offer.",
  headlineHighlight = "Plan your paycheck.",
  subtext = "Compare internship offers side-by-side, estimate take-home pay, and plan your budget — built for interns and early-career roles.",
  ctas = defaultCtas,
  feedHref = "/offers",
  className,
}: HeroSectionProps) {
  return (
    <section
      className={cn(
        "relative pt-24 pb-28 lg:pt-32 lg:pb-32 overflow-hidden",
        className,
      )}
    >
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

        <div className="flex flex-row justify-center items-center gap-4 max-w-lg mx-auto">
          {ctas.map((cta) => (
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
                  "bg-primary/10 dark:bg-primary/15 group-hover:bg-primary/20 dark:group-hover:bg-primary/25",
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
          ))}
        </div>

        <Link
          href={feedHref}
          className="inline-flex items-center gap-1.5 mt-6 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Browse the community feed
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
