import { render, screen } from "@testing-library/react";
import { BudgetPlannerEmptyState } from "./BudgetPlannerEmptyState";

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

describe("BudgetPlannerEmptyState", () => {
  it("shows title, description, and link to calculator", () => {
    render(
      <BudgetPlannerEmptyState
        title="No configs"
        description="Save a paycheck setup first."
      />,
    );

    expect(screen.getByText("No configs")).toBeInTheDocument();
    expect(screen.getByText("Save a paycheck setup first.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to calculator/i })).toHaveAttribute(
      "href",
      "/calculator",
    );
  });
});
