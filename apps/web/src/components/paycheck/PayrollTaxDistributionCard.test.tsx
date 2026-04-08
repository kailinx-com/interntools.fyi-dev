import { render, screen } from "@testing-library/react";
import { PayrollTaxDistributionCard } from "./PayrollTaxDistributionCard";

describe("PayrollTaxDistributionCard", () => {
  it("renders title and chart region", () => {
    render(
      <PayrollTaxDistributionCard
        taxPieData={[
          { bucket: "Net Pay", value: 3000, fill: "#0f0" },
          { bucket: "Federal Tax", value: 500, fill: "#f00" },
        ]}
      />,
    );

    expect(screen.getByText("Tax Distribution")).toBeInTheDocument();
    expect(document.querySelector("[data-slot='chart']")).toBeTruthy();
  });
});
