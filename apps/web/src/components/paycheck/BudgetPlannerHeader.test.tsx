import { render, screen } from "@testing-library/react";
import { BudgetPlannerHeader } from "./BudgetPlannerHeader";

jest.mock("next/link", () => ({
  __esModule: true,
  default({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  },
}));

describe("BudgetPlannerHeader", () => {
  it("shows total net pay and optional hint", () => {
    render(
      <BudgetPlannerHeader
        totalNetPay={4200}
        savedPlansHint="Pick a plan to continue"
      />,
    );

    expect(screen.getByRole("heading", { name: /budget planner/i })).toBeInTheDocument();
    expect(screen.getByText("$4,200")).toBeInTheDocument();
    expect(screen.getByText("Pick a plan to continue")).toBeInTheDocument();
  });

  it("renders saved plans panel when provided", () => {
    render(
      <BudgetPlannerHeader totalNetPay={100} savedPlansPanel={<div>Saved panel</div>} />,
    );
    expect(screen.getByText("Saved panel")).toBeInTheDocument();
  });
});
