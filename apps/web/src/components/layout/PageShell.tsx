import type { ReactNode } from "react";
import { Footer, Navbar } from "@/components/landing";

type PageShellProps = {
  children: ReactNode;
  showFooter?: boolean;
};

export function PageShell({ children, showFooter = true }: PageShellProps) {
  return (
    <div className="bg-background-light dark:bg-background-dark text-foreground min-h-screen relative overflow-x-hidden">
      <Navbar />
      <main className="pt-16">{children}</main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}
