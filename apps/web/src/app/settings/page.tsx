"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto py-12 px-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your app preferences.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Choose how interntools.fyi looks to you.</p>
            <div className="grid grid-cols-3 gap-3">
              {themes.map(({ value, label, icon: Icon }) => {
                const active = mounted && theme === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/40 hover:border-primary/60 hover:bg-accent text-foreground",
                    )}
                  >
                    <Icon className="size-5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
