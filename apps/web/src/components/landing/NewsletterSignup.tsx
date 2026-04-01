"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface NewsletterSignupProps {
  title?: string;
  description?: string;
  placeholder?: string;
  submitLabel?: string;
  onSubmit?: (email: string) => void | Promise<void>;
  className?: string;
}

export function NewsletterSignup({
  title = "Get Weekly Updates",
  description = "Product updates on offer comparison features and paycheck tools.",
  placeholder = "Your email",
  submitLabel,
  onSubmit,
  className,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await onSubmit?.(email.trim());
      setEmail("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "bg-primary/5 dark:bg-primary/10 rounded-xl p-6 border border-primary/20",
        className,
      )}
    >
      <h3 className="font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {description}
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border dark:border-primary/20 bg-card dark:bg-neutral-surface-dark text-sm px-3 py-2 focus:ring-primary focus:border-primary"
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary/5 dark:bg-primary/10 dark:text-primary hover:bg-primary dark:hover:bg-secondary-foreground dark:hover:text-secondary rounded-lg px-3 py-2 shrink-0"
        >
          {submitLabel ?? (
            <ArrowRight className="size-4" aria-label="Subscribe" />
          )}
        </Button>
      </form>
    </div>
  );
}
