import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { PageShell } from "./PageShell";

jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

jest.mock("@/components/landing", () => ({
  Navbar: () => <nav aria-label="Test nav">Nav</nav>,
  Footer: jest.requireActual("@/components/landing/Footer").Footer,
}));

describe("PageShell", () => {
  it("includes footer with Privacy Policy on first paint so policy is reachable without a gate", () => {
    render(
      <PageShell>
        <p>Main content</p>
      </PageShell>,
    );

    expect(screen.getByText("Main content")).toBeInTheDocument();
    const footer = screen.getByRole("contentinfo");
    expect(
      within(footer).getByRole("link", { name: /privacy policy/i }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      within(footer).getByRole("link", { name: /cookie settings/i }),
    ).toHaveAttribute("href", "/privacy#cookies");
  });

  it("omits footer when showFooter is false", () => {
    render(
      <PageShell showFooter={false}>
        <p>Only main</p>
      </PageShell>,
    );
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });

  it("does not render a cookie consent dialog or first-visit modal", () => {
    const { container } = render(
      <PageShell>
        <p>Page</p>
      </PageShell>,
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('[aria-modal="true"]')).toBeNull();
  });
});
