import { BudgetPlanner, PayrollCalculator } from "./index";

describe("paycheck barrel", () => {
  it("re-exports main components", () => {
    expect(PayrollCalculator).toBeDefined();
    expect(BudgetPlanner).toBeDefined();
  });
});
