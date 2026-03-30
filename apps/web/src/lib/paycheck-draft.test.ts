import {
  clearStoredPaycheckDraft,
  getStoredPaycheckConfig,
  getStoredPlannerData,
  getStoredSelectedCalculatorConfig,
  getStoredSelectedPlannerDocument,
  saveStoredPaycheckConfig,
  saveStoredPlannerData,
  saveStoredSelectedCalculatorConfig,
  saveStoredSelectedPlannerDocument,
} from "./paycheck-draft";
import { DEFAULT_PAYCHECK_CONFIG } from "./paycheck";

describe("paycheck draft storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    clearStoredPaycheckDraft();
  });

  it("stores calculator config independently", () => {
    saveStoredPaycheckConfig({
      ...DEFAULT_PAYCHECK_CONFIG,
      state: "TX",
      hourlyRate: 42,
    });

    expect(getStoredPaycheckConfig()).toEqual({
      ...DEFAULT_PAYCHECK_CONFIG,
      state: "TX",
      hourlyRate: 42,
    });
    expect(getStoredPlannerData()).toEqual({ expenses: [] });
  });

  it("preserves config when planner expenses are updated", () => {
    saveStoredPaycheckConfig(DEFAULT_PAYCHECK_CONFIG);
    saveStoredPlannerData({
      expenses: [
        {
          id: "rent",
          name: "Rent",
          defaultAmount: 1500,
          overrides: { "2026-06": 1600 },
        },
      ],
    });

    expect(getStoredPaycheckConfig()).toEqual(DEFAULT_PAYCHECK_CONFIG);
    expect(getStoredPlannerData()).toEqual({
      expenses: [
        {
          id: "rent",
          name: "Rent",
          defaultAmount: 1500,
          overrides: { "2026-06": 1600 },
        },
      ],
    });
  });

  it("preserves the selected saved calculator config across draft updates", () => {
    saveStoredSelectedCalculatorConfig({
      id: 7,
      name: "Summer config",
      config: DEFAULT_PAYCHECK_CONFIG,
    });
    saveStoredPaycheckConfig(DEFAULT_PAYCHECK_CONFIG);
    saveStoredPlannerData({
      expenses: [
        {
          id: "rent",
          name: "Rent",
          defaultAmount: 1500,
          overrides: {},
        },
      ],
    });

    expect(getStoredSelectedCalculatorConfig()).toEqual({
      id: 7,
      name: "Summer config",
      config: DEFAULT_PAYCHECK_CONFIG,
    });
  });

  it("stores the selected planner document independently", () => {
    saveStoredSelectedPlannerDocument({
      id: "planner-7",
      name: "Summer expense doc",
    });
    saveStoredPlannerData({ expenses: [] });

    expect(getStoredSelectedPlannerDocument()).toEqual({
      id: "planner-7",
      name: "Summer expense doc",
    });
  });
});
