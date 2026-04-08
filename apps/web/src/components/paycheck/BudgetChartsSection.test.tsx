import { render, screen } from "@testing-library/react";
import { BudgetChartsSection } from "./BudgetChartsSection";

describe("BudgetChartsSection", () => {
  it("renders both chart cards", () => {
    render(
      <BudgetChartsSection
        trendsData={[
          { month: "Jan", income: 3000, expense: 2000, savings: 1000 },
        ]}
        breakdownData={[
          { name: "Rent", value: 1200, fill: "#888" },
          { name: "Food", value: 400, fill: "#999" },
        ]}
      />,
    );

    expect(screen.getByText("Cash Flow Trends")).toBeInTheDocument();
    expect(screen.getByText("Spending Breakdown")).toBeInTheDocument();
    expect(document.querySelectorAll("[data-slot='chart']").length).toBe(2);
  });
});
