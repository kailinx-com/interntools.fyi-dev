import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PayrollHeader } from "./PayrollHeader";

describe("PayrollHeader", () => {
  it("calls onGoToPlanner when Budget Planner is clicked", async () => {
    const user = userEvent.setup();
    const onGoToPlanner = jest.fn();
    render(<PayrollHeader onGoToPlanner={onGoToPlanner} />);

    await user.click(screen.getByRole("button", { name: /budget planner/i }));
    expect(onGoToPlanner).toHaveBeenCalledTimes(1);
  });
});
