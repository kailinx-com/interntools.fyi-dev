import { cn } from "@/lib/utils";

export interface StatItem {
  value: string;
  label: string;
}

export interface StatsBarProps {
  stats?: StatItem[];
  className?: string;
}

const defaultStats: StatItem[] = [
  { value: "10k+", label: "Active Interns" },
  { value: "500+", label: "Companies" },
  { value: "50", label: "Major Cities" },
  { value: "4.9/5", label: "User Rating" },
];

export function StatsBar({ stats = defaultStats, className }: StatsBarProps) {
  return (
    <section
      className={cn(
        "border-y border-border bg-card dark:bg-neutral-surface-dark",
        className,
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-4 gap-8 text-center divide-x divide-border">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
