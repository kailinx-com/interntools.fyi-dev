import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import RootLayout from "./layout";

jest.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-display" }),
}));

jest.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

jest.mock("@/components/auth/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

describe("RootLayout", () => {
  it("wraps children with theme and auth providers", () => {
    render(
      <RootLayout>
        <span>page-body</span>
      </RootLayout>,
    );

    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
    expect(screen.getByTestId("auth-provider")).toContainElement(screen.getByText("page-body"));
  });
});
