import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { PayrollCalculator } from "./PayrollCalculator";
import { getCalculatorConfig } from "@/lib/paycheck/api";
import { DEFAULT_PAYCHECK_CONFIG } from "@/lib/paycheck";

const mockSearchGet = jest.fn((_key: string): string | null => null);

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchGet(key),
  }),
}));

let mockToken: string | null = null;
jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({
    token: mockToken,
    isAuthenticated: Boolean(mockToken),
    isLoading: false,
  }),
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

const mockGetCalculatorConfig = jest.mocked(getCalculatorConfig);

describe("PayrollCalculator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToken = null;
    mockSearchGet.mockImplementation(() => null);
    mockGetCalculatorConfig.mockResolvedValue({
      id: 9,
      name: "Saved",
      createdAt: "2026-01-01T00:00:00Z",
      config: DEFAULT_PAYCHECK_CONFIG,
    });
  });

  it("renders shell sections and disclaimer", () => {
    render(<PayrollCalculator />);
    expect(screen.getByText("Payroll Header")).toBeInTheDocument();
    expect(screen.getByText("Payroll Config")).toBeInTheDocument();
    expect(screen.getByText(/disclaimer/i)).toBeInTheDocument();
  });

  it("loads saved config when ?scenario= is present and user is authenticated", async () => {
    mockToken = "tok";
    mockSearchGet.mockImplementation((key) => (key === "scenario" ? "9" : null));

    render(<PayrollCalculator />);

    await waitFor(() => {
      expect(mockGetCalculatorConfig).toHaveBeenCalledWith("tok", 9);
    });
  });
});
