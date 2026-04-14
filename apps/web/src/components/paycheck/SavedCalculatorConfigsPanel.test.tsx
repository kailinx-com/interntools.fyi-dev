import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SavedCalculatorConfigsPanel } from "./SavedCalculatorConfigsPanel";
import { DEFAULT_PAYCHECK_CONFIG } from "@/lib/paycheck";

const mockListCalculatorConfigs = jest.fn();
const mockSaveCalculatorConfig = jest.fn();

jest.mock("@/lib/paycheck/draft", () => ({
  getStoredSelectedCalculatorConfig: () => null,
  saveStoredSelectedCalculatorConfig: jest.fn(),
}));
jest.mock("@/lib/paycheck/api", () => ({
  listCalculatorConfigs: (...args: unknown[]) => mockListCalculatorConfigs(...args),
  saveCalculatorConfig: (...args: unknown[]) => mockSaveCalculatorConfig(...args),
  getCalculatorConfig: jest.fn(),
  deleteCalculatorConfig: jest.fn(),
  formatSavedItemTimestamp: () => "recently",
}));

describe("SavedCalculatorConfigsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListCalculatorConfigs.mockResolvedValue([]);
    mockSaveCalculatorConfig.mockResolvedValue({
      id: 1,
      name: "Plan A",
      config: DEFAULT_PAYCHECK_CONFIG,
      createdAt: new Date().toISOString(),
    });
  });

  it("shows list error in manage dialog when configs cannot be loaded", async () => {
    mockListCalculatorConfigs.mockRejectedValueOnce(new Error("Network error"));
    const user = userEvent.setup();
    render(
      <SavedCalculatorConfigsPanel
        token="tok"
        currentConfig={DEFAULT_PAYCHECK_CONFIG}
        onLoad={jest.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /manage configs/i }));

    expect(await screen.findByText("Network error")).toBeInTheDocument();
  });

  it("saves config with entered name", async () => {
    const user = userEvent.setup();
    render(
      <SavedCalculatorConfigsPanel
        token="tok"
        currentConfig={DEFAULT_PAYCHECK_CONFIG}
        onLoad={jest.fn()}
      />,
    );

    await user.type(
      screen.getByPlaceholderText("Summer 2026 internship config"),
      "Plan A",
    );
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(mockSaveCalculatorConfig).toHaveBeenCalledWith("tok", {
        name: "Plan A",
        config: DEFAULT_PAYCHECK_CONFIG,
      }),
    );
  });
});
