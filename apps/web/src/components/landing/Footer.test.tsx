import React from "react";
import { render, screen, within } from "@testing-library/react";

import { Footer, type FooterProps } from "./Footer";

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
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`Copyright ${year}`))).toBeInTheDocument();
    expect(screen.getByText(/Made with/i)).toBeInTheDocument();
    expect(screen.getByText(/for students/i)).toBeInTheDocument();
  });

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
