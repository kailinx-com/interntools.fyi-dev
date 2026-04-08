import { render, screen } from "@testing-library/react";
import { PayrollTrendsCard } from "./PayrollTrendsCard";

describe("PayrollTrendsCard", () => {
  it("renders chart for history data", () => {
    render(
      <PayrollTrendsCard
        historyData={[
          { period: "P1", net: 2000, taxes: 400 },
          { period: "P2", net: 2100, taxes: 420 },
        ]}
      />,
    );

    expect(screen.getByText("Pay Period Trends")).toBeInTheDocument();
    expect(document.querySelector("[data-slot='chart']")).toBeTruthy();
  });
});
