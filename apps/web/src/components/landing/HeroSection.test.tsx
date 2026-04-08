import { render, screen } from "@testing-library/react";
import { HeroSection } from "./HeroSection";

describe("HeroSection", () => {
  it("renders default headline and feed link", () => {
    render(<HeroSection />);
    expect(screen.getByText("Know your offer.")).toBeInTheDocument();
    expect(screen.getByText("Plan your paycheck.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse the community feed/i })).toHaveAttribute(
      "href",
      "/offers",
    );
  });

  it("supports custom props and no badge/subtext", () => {
    render(
      <HeroSection
        badge=""
        subtext=""
        ctas={[{ title: "One", description: "Desc", href: "/x" }]}
        feedHref="/custom-feed"
      />,
    );

    expect(screen.queryByText(/paycheck tools/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/compare internship offers/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /one/i })).toHaveAttribute("href", "/x");
    expect(screen.getByRole("link", { name: /browse the community feed/i })).toHaveAttribute(
      "href",
      "/custom-feed",
    );
  });
});
