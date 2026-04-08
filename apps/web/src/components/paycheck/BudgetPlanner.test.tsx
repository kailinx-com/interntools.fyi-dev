import { render, screen, waitFor } from "@testing-library/react";
import { BudgetPlanner } from "./BudgetPlanner";

const mockUseAuth = jest.fn();
const mockListCalculatorConfigs = jest.fn();

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => null }),
}));
jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));
jest.mock("@/lib/paycheck/api", () => ({
  listCalculatorConfigs: (...args: unknown[]) => mockListCalculatorConfigs(...args),
  getCalculatorConfig: jest.fn(),
  getPlannerDocument: jest.fn(),
}));
jest.mock("@/lib/paycheck/draft", () => ({
  getStoredPlannerData: () => ({ expenses: [] }),
  getStoredSelectedCalculatorConfig: () => null,
  saveStoredSelectedCalculatorConfig: jest.fn(),
  saveStoredPlannerData: jest.fn(),
}));

describe("BudgetPlanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows sign-in empty state for unauthenticated users", () => {
    mockUseAuth.mockReturnValue({ token: null, isAuthenticated: false, isLoading: false });
    render(<BudgetPlanner />);
    expect(screen.getByText(/sign in to use the budget planner/i)).toBeInTheDocument();
  });

  it("shows no-saved-config state when authenticated with no configs", async () => {
    mockUseAuth.mockReturnValue({ token: "tok", isAuthenticated: true, isLoading: false });
    mockListCalculatorConfigs.mockResolvedValue([]);

    render(<BudgetPlanner />);
    await waitFor(() => expect(screen.getByText(/no saved calculator configs/i)).toBeInTheDocument());
  });
});
