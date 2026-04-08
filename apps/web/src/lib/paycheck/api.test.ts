import {
  deleteCalculatorConfig,
  deletePlannerDocument,
  formatSavedItemTimestamp,
  getCalculatorConfig,
  getPlannerDocument,
  listCalculatorConfigs,
  listPlannerDocuments,
  normalizeLoadedCalculatorConfig,
  normalizeLoadedPlannerData,
  normalizeLoadedPlannerDocument,
  normalizeSavedName,
  saveCalculatorConfig,
  savePlannerDocument,
} from "./api";
import { apiRequest } from "@/lib/auth/http";
import { DEFAULT_PAYCHECK_CONFIG } from "./index";

jest.mock("@/lib/auth/http", () => ({
  apiRequest: jest.fn(),
}));

describe("paycheck api", () => {
  const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("formatSavedItemTimestamp", () => {
    it("returns a fallback label for nullish timestamps", () => {
      expect(formatSavedItemTimestamp(null)).toBe("Saved recently");
      expect(formatSavedItemTimestamp(undefined)).toBe("Saved recently");
    });

    it("returns a fallback label for blank timestamps", () => {
      expect(formatSavedItemTimestamp("   ")).toBe("Saved recently");
    });

    it("handles timezone-less iso values", () => {
      expect(formatSavedItemTimestamp("2026-03-29T10:15:30")).not.toBe("Saved recently");
    });

    it("returns fallback for invalid numeric timestamp", () => {
      expect(formatSavedItemTimestamp("999999999999999999999")).toBe("Saved recently");
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

  describe("normalizeSavedName", () => {
    it("trims valid names", () => {
      expect(normalizeSavedName("  Summer Plan  ")).toBe("Summer Plan");
    });

    it("throws for blank and too-long names", () => {
      expect(() => normalizeSavedName("   ")).toThrow("Name is required.");
      expect(() => normalizeSavedName("a".repeat(101))).toThrow(
        "Name must be 100 characters or fewer.",
      );
    });
  });

  describe("api wrappers", () => {
    it("save/list/get/delete calculator config wrappers", async () => {
      mockedApiRequest.mockResolvedValueOnce({
        id: 1,
        name: "A",
        createdAt: "2026-01-01T00:00:00Z",
        config: DEFAULT_PAYCHECK_CONFIG,
      } as never);
      await saveCalculatorConfig("tok", { name: " A ", config: DEFAULT_PAYCHECK_CONFIG });
      expect(mockedApiRequest).toHaveBeenCalledWith("/paycheck/scenarios", expect.objectContaining({
        method: "POST",
        token: "tok",
      }));

      mockedApiRequest.mockResolvedValueOnce([] as never);
      await listCalculatorConfigs("tok");
      expect(mockedApiRequest).toHaveBeenCalledWith("/paycheck/scenarios", { token: "tok" });

      mockedApiRequest.mockResolvedValueOnce({
        id: 1,
        name: "A",
        createdAt: "2026-01-01T00:00:00Z",
        config: DEFAULT_PAYCHECK_CONFIG,
      } as never);
      await getCalculatorConfig("tok", 1);
      expect(mockedApiRequest).toHaveBeenCalledWith("/paycheck/scenarios/1", { token: "tok" });

      mockedApiRequest.mockResolvedValueOnce(undefined as never);
      await deleteCalculatorConfig("tok", 1);
      expect(mockedApiRequest).toHaveBeenCalledWith("/paycheck/scenarios/1", {
        method: "DELETE",
        token: "tok",
      });
    });

    it("save/list/get/delete planner wrappers", async () => {
      mockedApiRequest.mockResolvedValueOnce({
        id: "p1",
        name: "Planner",
        data: { expenses: [] },
      } as never);
      await savePlannerDocument("tok", { name: " Planner ", plannerData: { expenses: [] } });
      expect(mockedApiRequest).toHaveBeenCalledWith("/paycheck/planner", expect.objectContaining({
        method: "POST",
        token: "tok",
      }));

      mockedApiRequest.mockResolvedValueOnce([] as never);
      await listPlannerDocuments("tok");
      expect(mockedApiRequest).toHaveBeenCalledWith("/paycheck/planner", { token: "tok" });

      mockedApiRequest.mockResolvedValueOnce({
        id: "p1",
        name: "Planner",
        data: { expenses: [] },
      } as never);
      await getPlannerDocument("tok", "p1");
      expect(mockedApiRequest).toHaveBeenCalledWith("/paycheck/planner/p1", { token: "tok" });

      mockedApiRequest.mockResolvedValueOnce(undefined as never);
      await deletePlannerDocument("tok", "p1");
      expect(mockedApiRequest).toHaveBeenCalledWith("/paycheck/planner/p1", {
        method: "DELETE",
        token: "tok",
      });
    });
  });
});
