import { render, screen } from "@testing-library/react";
import { PayrollSummaryCards } from "./PayrollSummaryCards";

describe("PayrollSummaryCards", () => {
  it("renders gross, deductions, and net with formatted amounts", () => {
    render(
      <PayrollSummaryCards totalGross={5000} totalDeductions={1200} netTotal={3800} />,
    );

    expect(screen.getByText("Gross Pay")).toBeInTheDocument();
    expect(screen.getByText("Total Deductions")).toBeInTheDocument();
    expect(screen.getByText("Net Take-Home")).toBeInTheDocument();
    expect(screen.getByText("$5,000")).toBeInTheDocument();
    expect(screen.getByText("-$1,200")).toBeInTheDocument();
    expect(screen.getByText("$3,800")).toBeInTheDocument();
  });
});
