import {
  formatSavedItemTimestamp,
  normalizeLoadedCalculatorConfig,
  normalizeLoadedPlannerData,
  normalizeLoadedPlannerDocument,
} from "./paycheck-persistence";

describe("paycheck persistence", () => {
  describe("formatSavedItemTimestamp", () => {
    it("returns a fallback label for nullish timestamps", () => {
      expect(formatSavedItemTimestamp(null)).toBe("Saved recently");
      expect(formatSavedItemTimestamp(undefined)).toBe("Saved recently");
    });

    it("returns a fallback label for blank timestamps", () => {
      expect(formatSavedItemTimestamp("   ")).toBe("Saved recently");
    });
  });

  describe("normalizeLoadedPlannerData", () => {
    it("keeps only planner expenses", () => {
      expect(
        normalizeLoadedPlannerData({
          months: [{ key: "2026-05", label: "May 2026", netPay: 4200 }],
          expenses: [
            {
              id: "rent",
              name: "Rent",
              defaultAmount: 1500,
              overrides: {},
            },
          ],
        }),
      ).toEqual({
        expenses: [
          {
            id: "rent",
            name: "Rent",
            defaultAmount: 1500,
            overrides: {},
          },
        ],
      });
    });

    it("falls back to an empty expense list", () => {
      expect(normalizeLoadedPlannerData(null)).toEqual({ expenses: [] });
    });
  });

  describe("normalizeLoadedCalculatorConfig", () => {
    it("normalizes a loaded saved calculator config", () => {
      expect(
        normalizeLoadedCalculatorConfig({
          id: 7,
          name: "Summer config",
          createdAt: "2026-03-29T10:15:30Z",
          config: {
            startDate: "2026-05-04",
            endDate: "2026-09-04",
            state: "CA",
            hourlyRate: 56,
            workHoursPerDay: 8,
            workDaysPerWeek: 5,
            stipendPerWeek: 650,
            residency: "nonresident",
            visaType: "F1",
            arrivalYear: 2021,
            ficaMode: "exempt",
            isWorkAuthorized: true,
          },
        }),
      ).toEqual({
        id: 7,
        name: "Summer config",
        createdAt: "2026-03-29T10:15:30Z",
        config: {
          startDate: "2026-05-04",
          endDate: "2026-09-04",
          state: "CA",
          hourlyRate: 56,
          workHoursPerDay: 8,
          workDaysPerWeek: 5,
          stipendPerWeek: 650,
          residency: "nonresident",
          visaType: "F1",
          arrivalYear: 2021,
          ficaMode: "exempt",
        },
      });
    });
  });

  describe("normalizeLoadedPlannerDocument", () => {
    it("normalizes a loaded planner document into expenses only", () => {
      expect(
        normalizeLoadedPlannerDocument({
          id: "planner-7",
          name: "Summer expenses",
          data: {
            expenses: [
              {
                id: "rent",
                name: "Rent",
                defaultAmount: 1500,
                overrides: { "2026-06": 1600 },
              },
            ],
            months: [{ key: "2026-06", label: "Jun 2026", netPay: 4200 }],
          },
        }),
      ).toEqual({
        id: "planner-7",
        name: "Summer expenses",
        plannerData: {
          expenses: [
            {
              id: "rent",
              name: "Rent",
              defaultAmount: 1500,
              overrides: { "2026-06": 1600 },
            },
          ],
        },
      });
    });
  });
});
