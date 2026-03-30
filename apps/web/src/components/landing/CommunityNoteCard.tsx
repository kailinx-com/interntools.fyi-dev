import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommunityNoteCardProps {
  tag: string;
  tagVariant?: "location" | "salary" | "advice" | "default";
  meta?: string;
  title: string;
  excerpt: string;
  href?: string;
  className?: string;
}

const tagClasses: Record<string, string> = {
  location: "bg-secondary text-secondary-foreground",
  salary: "bg-primary/10 text-primary-dark dark:text-primary",
  advice: "bg-accent text-accent-foreground",
  default: "bg-muted text-muted-foreground",
};

export function CommunityNoteCard({
  tag,
  tagVariant = "default",
  meta,
  title,
  excerpt,
  href = "#",
  className,
}: CommunityNoteCardProps) {
  const tagClass = tagClasses[tagVariant] ?? tagClasses.default;

  const content = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 mb-2">
          <span
            className={cn("text-xs font-semibold px-2 py-1 rounded", tagClass)}
          >
            {tag}
          </span>
          {meta && (
            <span className="text-xs text-muted-foreground">{meta}</span>
          )}
        </div>
        <ExternalLink className="size-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2">
        {excerpt}
      </p>
    </>
  );

  return (
    <Link
      href={href}
      className={cn(
        "group block bg-card dark:bg-neutral-surface-dark rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer",
        className,
      )}
    >
      {content}
    </Link>
  );
}
