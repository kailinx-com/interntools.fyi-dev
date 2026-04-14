import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Place | interntools.fyi",
  description: "Community posts for this location.",
};

export default function DetailsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
