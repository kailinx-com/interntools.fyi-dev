import { render, screen } from "@testing-library/react";
import RootLayout from "./layout";

jest.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme">{children}</div>
  ),
}));

jest.mock("@/components/auth/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth">{children}</div>
  ),
}));

describe("RootLayout", () => {
  it("wraps app content without a cookie banner or first-visit modal in the tree", () => {
    const { container } = render(
      <RootLayout>
        <main data-testid="page">Hello</main>
      </RootLayout>,
    );

    expect(screen.getByTestId("page")).toHaveTextContent("Hello");
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('[aria-modal="true"]')).toBeNull();
    expect(container.textContent?.toLowerCase() ?? "").not.toContain("accept all cookies");
    expect(container.textContent?.toLowerCase() ?? "").not.toContain("cookie consent");
  });
});
