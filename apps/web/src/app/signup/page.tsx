import type { Metadata } from "next";
import { SignupCard } from "@/components/auth/SignupCard";

export const metadata: Metadata = {
  title: "Create account | interntools.fyi",
  description:
    "Create an interntools.fyi account to save your preferences and access upcoming intern tools.",
};

export default function SignupPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <SignupCard />
    </div>
  );
}
