import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PayrollConfigurationCard } from "./PayrollConfigurationCard";
import { DEFAULT_PAYCHECK_CONFIG } from "@/lib/paycheck";

describe("PayrollConfigurationCard", () => {
  it("renders hint/panel and triggers config updates", async () => {
    const user = userEvent.setup();
    const onConfigChange = jest.fn();

    render(
      <PayrollConfigurationCard
        config={DEFAULT_PAYCHECK_CONFIG}
        states={[{ value: "CA", label: "California" }]}
        ficaMode="exempt"
        onConfigChange={onConfigChange}
        savedPlansHint="Sign in to save"
        savedPlansPanel={<div>Panel</div>}
      />,
    );

    expect(screen.getByText("Configuration")).toBeInTheDocument();
    expect(screen.getByText("Sign in to save")).toBeInTheDocument();
    expect(screen.getByText("Panel")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Hourly Rate ($)"));
    await user.type(screen.getByLabelText("Hourly Rate ($)"), "65");
    expect(onConfigChange).toHaveBeenCalledWith("hourlyRate", expect.any(Number));
  });
});
