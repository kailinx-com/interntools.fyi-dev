"use client";

import { useState } from "react";
import Image from "next/image";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrendingCitiesWidgetProps {
  title?: string;
  cities?: string[];
  topDestinationImage?: string;
  topDestinationTitle?: string;
  topDestinationSubtitle?: string;
  className?: string;
}

const defaultCities = [
  "San Francisco",
  "New York",
  "Seattle",
  "Austin",
  "Boston",
  "Chicago",
];

export function TrendingCitiesWidget({
  title = "Trending Cities",
  cities = defaultCities,
  topDestinationImage = "https://images.unsplash.com/photo-1501594907352-04cda38eb297?w=400&h=160&fit=crop",
  topDestinationTitle = "Top Destination",
  topDestinationSubtitle = "San Francisco Bay Area",
  className,
}: TrendingCitiesWidgetProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div
      className={cn(
        "bg-card dark:bg-neutral-surface-dark rounded-xl p-6 border border-border shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="size-5 text-primary" />
        <h3 className="font-bold text-foreground">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {cities.map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => setSelected(selected === city ? null : city)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
              "bg-primary/5 dark:bg-primary/10 text-primary",
              "hover:bg-primary dark:hover:bg-secondary-foreground dark:hover:text-secondary",
              "border-border",
              selected === city && "bg-primary text-primary-foreground border-primary",
            )}
          >
            {city}
          </button>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-border">
        <div className="h-40 w-full rounded-lg bg-secondary dark:bg-muted relative overflow-hidden group">
          <Image
            src={topDestinationImage}
            alt={topDestinationTitle}
            fill
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex items-end p-4">
            <div>
              <p className="text-white font-bold text-sm">
                {topDestinationTitle}
              </p>
              <p className="text-white/80 text-xs">{topDestinationSubtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
