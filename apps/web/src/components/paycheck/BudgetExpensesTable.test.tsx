import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PlannerExpense, PlannerMonthNet } from "@/lib/paycheck/api";
import { BudgetExpensesTable } from "./BudgetExpensesTable";

const months: PlannerMonthNet[] = [
  { key: "2026-01", label: "Jan 2026", netPay: 2000 },
  { key: "2026-02", label: "Feb 2026", netPay: 2000 },
];

const expense: PlannerExpense = {
  id: "e1",
  name: "Rent",
  defaultAmount: 800,
  overrides: {},
};

describe("BudgetExpensesTable", () => {
  it("fires override, percentage, and remove handlers", async () => {
    const user = userEvent.setup();
    const onSetOverride = jest.fn();
    const onUpdateByPercentage = jest.fn();
    const onRemoveExpense = jest.fn();

    const getOverride = (e: PlannerExpense, monthKey: string) =>
      e.id === "e1" && monthKey === "2026-01" ? "900" : "0";
    const expenseTotal = () => 900;
    const monthTotalExpenses = (key: string) => (key === "2026-01" ? 900 : 0);

    render(
      <BudgetExpensesTable
        months={months}
        expenses={[expense]}
        grandTotals={{ netPay: 4000, expenses: 900, savings: 3100 }}
        getOverride={getOverride}
        expenseTotal={expenseTotal}
        monthTotalExpenses={monthTotalExpenses}
        onSetOverride={onSetOverride}
        onUpdateByPercentage={onUpdateByPercentage}
        onRemoveExpense={onRemoveExpense}
      />,
    );

    const amountInputs = screen.getAllByRole("spinbutton");
    await user.clear(amountInputs[0]!);
    await user.type(amountInputs[0]!, "950");
    expect(onSetOverride).toHaveBeenCalled();

    const pctInput = screen
      .getAllByRole("spinbutton")
      .find((el) => el.className.includes("pr-6"));
    expect(pctInput).toBeDefined();
    await user.clear(pctInput!);
    await user.type(pctInput!, "25");
    expect(onUpdateByPercentage).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /delete rent/i }));
    expect(onRemoveExpense).toHaveBeenCalledWith("e1");
  });

  it("shows 0.0% expense share and footer strings when net pay is zero", () => {
    const getOverride = () => "0";
    const expenseTotal = () => 0;
    const monthTotalExpenses = () => 0;

    render(
      <BudgetExpensesTable
        months={months}
        expenses={[expense]}
        grandTotals={{ netPay: 0, expenses: 0, savings: 0 }}
        getOverride={getOverride}
        expenseTotal={expenseTotal}
        monthTotalExpenses={monthTotalExpenses}
        onSetOverride={jest.fn()}
        onUpdateByPercentage={jest.fn()}
        onRemoveExpense={jest.fn()}
      />,
    );

    const spinbuttons = screen.getAllByRole("spinbutton");
    const pctField = spinbuttons.find((el) => el.className.includes("pr-6"));
    expect(pctField).toHaveValue(0.0);
    expect(screen.getAllByText("0.0%").length).toBeGreaterThanOrEqual(2);
  });

  it("colors negative savings in rose", () => {
    const getOverride = () => "3000";
    const expenseTotal = () => 6000;
    const monthTotalExpenses = () => 3000;

    const { container } = render(
      <BudgetExpensesTable
        months={[{ key: "2026-01", label: "Jan", netPay: 2000 }]}
        expenses={[expense]}
        grandTotals={{ netPay: 2000, expenses: 6000, savings: -4000 }}
        getOverride={getOverride}
        expenseTotal={expenseTotal}
        monthTotalExpenses={monthTotalExpenses}
        onSetOverride={jest.fn()}
        onUpdateByPercentage={jest.fn()}
        onRemoveExpense={jest.fn()}
      />,
    );

    const rose = container.querySelector(".text-rose-500");
    expect(rose).toBeTruthy();
  });
});
