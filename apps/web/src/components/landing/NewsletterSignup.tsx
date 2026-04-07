"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface NewsletterSignupProps {
  title?: string;
  description?: string;
  placeholder?: string;
  submitLabel?: string;
  signupHref?: string;
  onSubmit?: (email: string) => void | Promise<void>;
  className?: string;
}

export function NewsletterSignup({
  title = "Join interntools.fyi",
  description = "Create a free account to save comparisons, paycheck scenarios, and planner budgets.",
  placeholder = "Your email",
  submitLabel,
  signupHref = "/signup",
  onSubmit,
  className,
}: NewsletterSignupProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(email.trim());
        setDone(true);
      } else {
        router.push(`${signupHref}?email=${encodeURIComponent(email.trim())}`);
      }
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
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      {done ? (
        <div className="flex items-center gap-2 text-sm text-primary font-medium">
          <CheckCircle className="size-4" />
          You&apos;re on the list!
        </div>
      ) : (
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
            disabled={loading || !email.trim()}
            className="bg-primary text-white hover:bg-primary/90 rounded-lg px-3 py-2 shrink-0"
          >
            {submitLabel ?? (
              <ArrowRight className="size-4" aria-label="Sign up" />
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
