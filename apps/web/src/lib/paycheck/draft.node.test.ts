/**
 * @jest-environment node
 */

import {
  clearStoredPaycheckDraft,
  getStoredPaycheckConfig,
  getStoredPlannerData,
  saveStoredPaycheckConfig,
} from "./draft";
import { DEFAULT_PAYCHECK_CONFIG } from "./index";

describe("paycheck draft (no window)", () => {
  it("read paths return null/empty and writes are no-ops", () => {
    expect(getStoredPaycheckConfig()).toBeNull();
    expect(getStoredPlannerData()).toEqual({ expenses: [] });
    saveStoredPaycheckConfig(DEFAULT_PAYCHECK_CONFIG);
    clearStoredPaycheckDraft();
    expect(getStoredPaycheckConfig()).toBeNull();
  });
});
