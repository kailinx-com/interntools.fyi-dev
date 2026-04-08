import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PeriodRow } from "@/lib/paycheck";
import { PayrollPeriodsTable } from "./PayrollPeriodsTable";

const row: PeriodRow = {
  id: "weekly-1",
  label: "Week 1",
  startDate: "2026-05-04",
  endDate: "2026-05-08",
  grossTotal: 500,
  taxFederal: 50,
  taxState: 10,
  taxFica: 30,
  taxSdi: 0,
  netPay: 410,
};

describe("PayrollPeriodsTable", () => {
  it("changes tab and triggers export", async () => {
    const user = userEvent.setup();
    const onTabChange = jest.fn();
    const onExportCsv = jest.fn();

    render(
      <PayrollPeriodsTable
        activeTab="weekly"
        rows={[row]}
        totals={{ gross: 500, fed: 50, state: 10, fica: 30, net: 410 }}
        onTabChange={onTabChange}
        onExportCsv={onExportCsv}
      />,
    );

    await user.click(screen.getByRole("tab", { name: /biweekly/i }));
    expect(onTabChange).toHaveBeenCalledWith("biweekly");

    await user.click(screen.getByRole("button", { name: /export csv/i }));
    expect(onExportCsv).toHaveBeenCalledTimes(1);

    expect(screen.getByText("Week 1")).toBeInTheDocument();
    expect(screen.getByText("Total Period")).toBeInTheDocument();
  });
});
