import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import BudgetPlannerPage from "./page";

jest.mock("@/components/layout/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="page-shell">{children}</div>
  ),
}));

jest.mock("@/components/paycheck", () => ({
  BudgetPlanner: () => <div data-testid="budget-planner" />,
}));

describe("/calculator/planner page", () => {
  it("renders budget planner inside the shell", () => {
    render(<BudgetPlannerPage />);
    expect(screen.getByTestId("page-shell")).toBeInTheDocument();
    expect(screen.getByTestId("budget-planner")).toBeInTheDocument();
  });
});
