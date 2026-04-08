import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import PaycheckCalculatorPage from "./page";

jest.mock("@/components/layout/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="page-shell">{children}</div>
  ),
}));

jest.mock("@/components/paycheck", () => ({
  PayrollCalculator: () => <div data-testid="payroll-calculator" />,
}));

describe("/calculator page", () => {
  it("renders payroll calculator inside the shell", () => {
    render(<PaycheckCalculatorPage />);
    expect(screen.getByTestId("page-shell")).toBeInTheDocument();
    expect(screen.getByTestId("payroll-calculator")).toBeInTheDocument();
  });
});
