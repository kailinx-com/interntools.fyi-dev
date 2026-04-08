import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { PayrollCalculator } from "./PayrollCalculator";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ token: null, isAuthenticated: false, isLoading: false }),
}));

jest.mock("@/components/paycheck/PayrollHeader", () => ({
  PayrollHeader: () => <div>Payroll Header</div>,
}));
jest.mock("@/components/paycheck/PayrollConfigurationCard", () => ({
  PayrollConfigurationCard: () => <div>Payroll Config</div>,
}));
jest.mock("@/components/paycheck/PayrollSummaryCards", () => ({
  PayrollSummaryCards: () => <div>Summary Cards</div>,
}));
jest.mock("@/components/paycheck/LockedPaycheckSection", () => ({
  LockedPaycheckSection: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
jest.mock("@/components/paycheck/PayrollPeriodsTable", () => ({
  PayrollPeriodsTable: () => <div>Periods Table</div>,
}));
jest.mock("@/components/paycheck/PayrollTaxDistributionCard", () => ({
  PayrollTaxDistributionCard: () => <div>Tax Pie</div>,
}));
jest.mock("@/components/paycheck/PayrollDetailedReceiptCard", () => ({
  PayrollDetailedReceiptCard: () => <div>Receipt</div>,
}));
jest.mock("@/components/paycheck/PayrollTrendsCard", () => ({
  PayrollTrendsCard: () => <div>Trends</div>,
}));
jest.mock("@/lib/paycheck/draft", () => ({
  getStoredPaycheckConfig: () => null,
  saveStoredPaycheckConfig: jest.fn(),
}));
jest.mock("@/lib/paycheck/api", () => ({
  getCalculatorConfig: jest.fn(),
}));

describe("PayrollCalculator", () => {
  it("renders shell sections and disclaimer", () => {
    render(<PayrollCalculator />);
    expect(screen.getByText("Payroll Header")).toBeInTheDocument();
    expect(screen.getByText("Payroll Config")).toBeInTheDocument();
    expect(screen.getByText(/disclaimer/i)).toBeInTheDocument();
  });
});
