import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CommunityNoteCard } from "./CommunityNoteCard";
import { TrendingCitiesWidget } from "./TrendingCitiesWidget";
import { NewsletterSignup } from "./NewsletterSignup";
import type { CommunityNoteCardProps } from "./CommunityNoteCard";
import { cn } from "@/lib/utils";

export interface CommunityNotesSectionProps {
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  notes?: CommunityNoteCardProps[];
  trendingCitiesProps?: React.ComponentProps<typeof TrendingCitiesWidget>;
  newsletterProps?: React.ComponentProps<typeof NewsletterSignup>;
  className?: string;
}

const defaultNotes: CommunityNoteCardProps[] = [
  {
    tag: "Housing",
    tagVariant: "housing",
    meta: "2 hours ago • Seattle, WA",
    title: "Available: 2B/2B in Capitol Hill for Amazon Summer Interns",
    excerpt:
      "Looking for two roommates for a fully furnished apartment. Walking distance to the spheres. Rent is $1200/mo including utilities...",
    href: "/signup",
  },
  {
    tag: "Salary",
    tagVariant: "salary",
    meta: "1 day ago • Menlo Park, CA",
    title: "Meta SWE Intern Offer Breakdown (Summer '24)",
    excerpt:
      "Just received my offer letter! Base is $8,500/mo + corporate housing stipend. Wanted to share for transparency...",
    href: "/signup",
  },
  {
    tag: "Advice",
    tagVariant: "advice",
    meta: "3 days ago • New York, NY",
    title: "Transportation tips for NYC Fintech interns",
    excerpt:
      "Don't rely on Uber during rush hour. The subway is faster and cheaper. Here is a map of the best lines for Wall St...",
    href: "/signup",
  },
];

export function CommunityNotesSection({
  title = "Community Notes",
  subtitle = "Real-time insights from fellow interns",
  viewAllHref = "/signup",
  viewAllLabel = "View all",
  notes = defaultNotes,
  trendingCitiesProps,
  newsletterProps,
  className,
}: CommunityNotesSectionProps) {
  return (
    <section
      id="community-notes"
      className={cn("py-24 max-w-7xl mx-auto px-6 lg:px-8", className)}
    >
      <div className="grid grid-cols-3 gap-12">
        {/* Latest Community Notes */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {subtitle}
              </p>
            </div>
            <Link
              href={viewAllHref}
              className="text-primary hover:text-primary-dark text-sm font-medium flex items-center"
            >
              {viewAllLabel} <ArrowRight className="size-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {notes.map((note, i) => (
              <CommunityNoteCard key={i} {...note} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <TrendingCitiesWidget {...trendingCitiesProps} />
          <NewsletterSignup {...newsletterProps} />
        </div>
      </div>
    </section>
  );
}
