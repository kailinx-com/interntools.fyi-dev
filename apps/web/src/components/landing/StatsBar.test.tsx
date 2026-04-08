import { render, screen } from "@testing-library/react";
import { StatsBar } from "./StatsBar";

describe("StatsBar", () => {
  it("renders default stat items", () => {
    render(<StatsBar />);
    expect(screen.getByText("All 50")).toBeInTheDocument();
    expect(screen.getByText("States covered")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("renders custom stat items", () => {
    render(<StatsBar stats={[{ value: "99%", label: "Coverage" }]} />);
    expect(screen.getByText("99%")).toBeInTheDocument();
    expect(screen.getByText("Coverage")).toBeInTheDocument();
  });
});
