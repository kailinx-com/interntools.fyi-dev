import { render, screen } from "@testing-library/react";
import { PayrollDetailedReceiptCard } from "./PayrollDetailedReceiptCard";

describe("PayrollDetailedReceiptCard", () => {
  it("renders breakdown bars and net when gross is positive", () => {
    render(
      <PayrollDetailedReceiptCard
        breakdown={[
          { key: "fed", label: "Federal", value: 100 },
          { key: "fica", label: "FICA", value: 50 },
        ]}
        totalGross={1000}
        netTotal={850}
      />,
    );

    expect(screen.getByText("Federal")).toBeInTheDocument();
    expect(screen.getByText("FICA")).toBeInTheDocument();
    expect(screen.getByText("Net Take-Home Pay")).toBeInTheDocument();
    expect(screen.getByText(/850\.00/)).toBeInTheDocument();
  });

  it("uses zero percent width when gross is zero", () => {
    const { container } = render(
      <PayrollDetailedReceiptCard
        breakdown={[{ key: "fed", label: "Federal", value: 0 }]}
        totalGross={0}
        netTotal={0}
      />,
    );

    const bars = container.querySelectorAll(".bg-primary.h-2.rounded-full");
    expect(bars.length).toBeGreaterThan(0);
    expect((bars[0] as HTMLElement).style.width).toBe("0%");
  });
});
