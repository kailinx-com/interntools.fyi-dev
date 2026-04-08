import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import HomePage from "./page";

jest.mock("@/components/layout/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="page-shell">{children}</div>
  ),
}));

jest.mock("@/components/landing", () => ({
  HeroSection: () => <div>Hero Section</div>,
  StatsBar: () => <div>Stats Bar</div>,
  CommunityNotesSection: () => <div>Community Notes Section</div>,
  FeatureHighlights: () => <div>Feature Highlights</div>,
}));

describe("Home page", () => {
  it("renders landing sections and CTA links", () => {
    render(<HomePage />);

    expect(screen.getByTestId("page-shell")).toBeInTheDocument();
    expect(screen.getByText("Hero Section")).toBeInTheDocument();
    expect(screen.getByText("Stats Bar")).toBeInTheDocument();
    expect(screen.getByText("Community Notes Section")).toBeInTheDocument();
    expect(screen.getByText("Feature Highlights")).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /get started for free/i }),
    ).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("link", { name: /browse the community/i })).toHaveAttribute(
      "href",
      "/offers",
    );
  });
});
