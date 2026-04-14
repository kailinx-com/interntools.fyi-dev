import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search by location | interntools.fyi",
  description: "Find a place and see community posts for that area.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
