import React from "react";
import { render, screen, within } from "@testing-library/react";

import { Footer, type FooterProps } from "./Footer";

const mockUseAuth = jest.fn();
jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe("Footer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it("renders brand, tagline, default product links, and copyright year", () => {
    render(<Footer />);

    const landmark = screen.getByRole("contentinfo");
    expect(within(landmark).getByText("interntools")).toBeInTheDocument();
    expect(screen.getByText(/Making the intern experience transparent/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Paycheck Calculator/i })).toHaveAttribute(
      "href",
      "/calculator",
    );
    expect(screen.getByRole("link", { name: /Privacy Policy/i })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(screen.getByRole("link", { name: /Cookie Settings/i })).toHaveAttribute(
      "href",
      "/privacy#cookies",
    );
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`Copyright ${year}`))).toBeInTheDocument();
    expect(screen.getByText(/Made with/i)).toBeInTheDocument();
    expect(screen.getByText(/for students/i)).toBeInTheDocument();
  });

  it.each([
    {
      label: "guest (logged out)",
      auth: {
        user: null as { username: string; role?: string } | null,
        isAuthenticated: false,
        isLoading: false,
      },
      expectAdminConsole: false,
    },
    {
      label: "student",
      auth: {
        user: { username: "bob", role: "STUDENT" },
        isAuthenticated: true,
        isLoading: false,
      },
      expectAdminConsole: false,
    },
    {
      label: "admin",
      auth: {
        user: { username: "root", role: "ADMIN" },
        isAuthenticated: true,
        isLoading: false,
      },
      expectAdminConsole: true,
    },
  ])(
    "Legal section adapts to login + role: %s",
    ({ auth, expectAdminConsole }) => {
      mockUseAuth.mockReturnValue(auth);
      render(<Footer />);
      const link = screen.queryByRole("link", { name: /admin console/i });
      const adminHrefLinks = screen
        .queryAllByRole("link")
        .filter((a) => a.getAttribute("href") === "/admin");
      if (expectAdminConsole) {
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/admin");
        expect(adminHrefLinks).toHaveLength(1);
      } else {
        expect(link).not.toBeInTheDocument();
        expect(adminHrefLinks).toHaveLength(0);
      }
    },
  );

  it("renders social links with aria-labels", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "facebook" })).toHaveAttribute(
      "href",
      "https://facebook.com",
    );
    expect(screen.getByRole("link", { name: "email" })).toHaveAttribute(
      "href",
      "mailto:hello@interntools.fyi",
    );
  });

  it("uses custom props when provided", () => {
    const props: FooterProps = {
      brandName: "CustomCo",
      brandSuffix: ".dev",
      tagline: "Custom tagline.",
      copyright: "Custom © line",
      linkGroups: [
        {
          title: "One",
          links: [{ label: "Only link", href: "/only" }],
        },
      ],
    };
    render(<Footer {...props} />);

    expect(screen.getByText("CustomCo")).toBeInTheDocument();
    expect(screen.getByText(".dev")).toBeInTheDocument();
    expect(screen.getByText("Custom tagline.")).toBeInTheDocument();
    expect(screen.getByText("Custom © line")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Only link" })).toHaveAttribute("href", "/only");
  });

  it("omits bottom line wrapper when bottomLine is null", () => {
    const { container } = render(<Footer bottomLine={null} />);
    expect(container.querySelector("footer")).toBeInTheDocument();
    expect(screen.queryByText(/for students/i)).not.toBeInTheDocument();
  });
});
