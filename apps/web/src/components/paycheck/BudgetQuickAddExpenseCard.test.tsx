import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetQuickAddExpenseCard } from "./BudgetQuickAddExpenseCard";

describe("BudgetQuickAddExpenseCard", () => {
  it("updates fields and invokes onAddExpense", async () => {
    const user = userEvent.setup();
    const onExpenseNameChange = jest.fn();
    const onExpenseAmountChange = jest.fn();
    const onAddExpense = jest.fn();

    render(
      <BudgetQuickAddExpenseCard
        expenseName=""
        expenseAmount=""
        onExpenseNameChange={onExpenseNameChange}
        onExpenseAmountChange={onExpenseAmountChange}
        onAddExpense={onAddExpense}
      />,
    );

    await user.type(screen.getByLabelText(/expense name/i), "Rent");
    expect(onExpenseNameChange).toHaveBeenCalled();

    await user.type(screen.getByLabelText(/monthly amount/i), "1200");
    expect(onExpenseAmountChange).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /add category/i }));
    expect(onAddExpense).toHaveBeenCalledTimes(1);
  });
});
