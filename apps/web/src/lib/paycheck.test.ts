import {
  calculatePayroll,
  calculateTax,
  deriveFicaMode,
  getBusinessDays,
  type PaycheckConfig,
} from "./paycheck";

describe("paycheck utilities", () => {
  describe("deriveFicaMode", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("returns exempt for F/J/M visas within the first 5 years", () => {
      expect(
        deriveFicaMode({
          visaType: "F1",
          arrivalYear: 2023,
        }),
      ).toBe("exempt");
    });

    it("returns withheld for F/J/M visas at 5 years or more", () => {
      expect(
        deriveFicaMode({
          visaType: "J1",
          arrivalYear: 2021,
        }),
      ).toBe("withheld");
    });

    it("returns withheld for non F/J/M visa types", () => {
      expect(
        deriveFicaMode({
          visaType: "Other",
          arrivalYear: 2025,
        }),
      ).toBe("withheld");
    });
  });

  describe("calculateTax", () => {
    it("returns 0 for non-positive income", () => {
      const brackets = [
        { l: 0, u: 10000, r: 0.1 },
        { l: 10000, u: 20000, r: 0.2 },
      ];

      expect(calculateTax(0, brackets)).toBe(0);
      expect(calculateTax(-100, brackets)).toBe(0);
    });

    it("calculates progressive tax across multiple brackets", () => {
      const brackets = [
        { l: 0, u: 10000, r: 0.1 },
        { l: 10000, u: 20000, r: 0.2 },
      ];

      // 10% of first 10k + 20% of next 10k = 1000 + 2000
      expect(calculateTax(20000, brackets)).toBe(3000);
    });
  });

  describe("getBusinessDays", () => {
    it("counts weekdays inclusively", () => {
      expect(getBusinessDays("2026-05-04", "2026-05-08")).toBe(5); // Mon-Fri
    });

    it("skips weekends", () => {
      expect(getBusinessDays("2026-05-09", "2026-05-10")).toBe(0); // Sat-Sun
    });

    it("handles ranges that cross a weekend", () => {
      expect(getBusinessDays("2026-05-08", "2026-05-11")).toBe(2); // Fri + Mon
    });
  });

  describe("calculatePayroll", () => {
    it("computes a no-tax payroll in a no-income-tax state", () => {
      const config = {
        startDate: "2026-05-04",
        endDate: "2026-05-08",
        state: "TX",
        hourlyRate: 10,
        workHoursPerDay: 8,
        workDaysPerWeek: 5,
        stipendPerWeek: 100,
        residency: "resident",
        visaType: "F1",
        arrivalYear: 2025,
        ficaMode: "exempt",
      } satisfies PaycheckConfig;

      const result = calculatePayroll(config);

      expect(result.summary.totalGross).toBe(500); // wages (400) + stipend (100)
      expect(result.summary.totalFed).toBe(0);
      expect(result.summary.totalState).toBe(0);
      expect(result.summary.totalFica).toBe(0);
      expect(result.summary.totalSdi).toBe(0);
      expect(result.summary.totalDeductions).toBe(0);
      expect(result.summary.netTotal).toBe(500);

      expect(result.weekly).toHaveLength(1);
      expect(result.biweekly).toHaveLength(1);
      expect(result.monthly).toHaveLength(1);
      expect(result.weekly[0]).toMatchObject({
        id: "weekly-1",
        label: "Week 1",
        startDate: "2026-05-04",
        endDate: "2026-05-08",
        grossTotal: 500,
        netPay: 500,
      });
    });

    it("applies federal, FICA, and CA SDI taxes correctly", () => {
      const config = {
        startDate: "2026-05-04",
        endDate: "2026-05-04",
        state: "CA",
        hourlyRate: 100,
        workHoursPerDay: 8,
        workDaysPerWeek: 5,
        stipendPerWeek: 100,
        residency: "nonresident",
        visaType: "Other",
        arrivalYear: 2020,
        ficaMode: "withheld",
      } satisfies PaycheckConfig;

      const result = calculatePayroll(config);

      expect(result.summary.totalGross).toBeCloseTo(820, 6);
      expect(result.summary.totalFed).toBeCloseTo(82, 6);
      expect(result.summary.totalState).toBeCloseTo(0, 6);
      expect(result.summary.totalFica).toBeCloseTo(61.2, 6);
      expect(result.summary.totalSdi).toBeCloseTo(9.02, 6);
      expect(result.summary.totalDeductions).toBeCloseTo(152.22, 6);
      expect(result.summary.netTotal).toBeCloseTo(667.78, 6);

      // Single-day range fits in exactly one row per period grouping.
      expect(result.weekly[0].netPay).toBeCloseTo(result.summary.netTotal, 6);
      expect(result.biweekly[0].netPay).toBeCloseTo(result.summary.netTotal, 6);
      expect(result.monthly[0].netPay).toBeCloseTo(result.summary.netTotal, 6);
    });
  });
});
