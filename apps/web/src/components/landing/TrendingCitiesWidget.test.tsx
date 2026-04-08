import { render, screen } from "@testing-library/react";
import { TrendingCitiesWidget } from "./TrendingCitiesWidget";

describe("TrendingCitiesWidget", () => {
  it("renders default quick tools", () => {
    render(<TrendingCitiesWidget />);
    expect(screen.getByText("Quick Tools")).toBeInTheDocument();
    expect(screen.getByText("Paycheck Calculator")).toBeInTheDocument();
    expect(screen.getByText("Compare Offers")).toBeInTheDocument();
  });

  it("renders custom tools", () => {
    render(
      <TrendingCitiesWidget
        title="Custom Tools"
        tools={[{ icon: null, label: "Tool A", description: "Desc A", href: "/a" }]}
      />,
    );
    expect(screen.getByText("Custom Tools")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tool a/i })).toHaveAttribute("href", "/a");
  });
});
