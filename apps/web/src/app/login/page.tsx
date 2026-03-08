import type { Metadata } from "next";
import { LoginCard } from "@/components/login/LoginCard";

export const metadata: Metadata = {
  title: "Sign in | interntools.fyi",
  description:
    "Log in to access your intern tools, saved housing searches, and paycheck estimates.",
};

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <LoginCard />
    </div>
  );
}
