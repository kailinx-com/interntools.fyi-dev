import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | interntools.fyi",
  description: "Manage user roles.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
