import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "My account | interntools.fyi",
  description:
    "Your profile and saved offers, comparisons, posts, and paycheck data.",
};

export default function MeLayout({ children }: { children: ReactNode }) {
  return children;
}
