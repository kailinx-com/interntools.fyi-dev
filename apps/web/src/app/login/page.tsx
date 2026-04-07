import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginCard } from "@/components/auth/LoginCard";

export const metadata: Metadata = {
  title: "Sign in | interntools.fyi",
  description:
    "Log in to save offers, comparisons, and paycheck scenarios on interntools.fyi.",
};

function LoginCardFallback() {
  return (
    <div
      className="bg-card h-80 w-full max-w-sm animate-pulse rounded-xl border"
      aria-hidden
    />
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <Suspense fallback={<LoginCardFallback />}>
        <LoginCard />
      </Suspense>
    </div>
  );
}
