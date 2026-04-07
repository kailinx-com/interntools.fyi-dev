import {
  formatMoney,
  formatMonthYear,
  formatShortDate,
} from "./format";

describe("paycheck format", () => {
  describe("formatMoney", () => {
    it("whole number returns valid formatted money", () => {
      expect(formatMoney(10)).toBe("10.00");
    });

    it("decimal number returns valid formatted money", () => {
      expect(formatMoney(10.0)).toBe("10.00");
    });

    it("decimal number with digits returns invalid formatted money", () => {
      expect(formatMoney(10.0, 0)).toBe("10");
    });

    it("decimal number with digits returns invalid formatted money", () => {
      expect(formatMoney(10.45672, 1)).toBe("10.5");
    });

    it("decimal number with digits returns invalid formatted money", () => {
      expect(formatMoney(10.4, 2)).toBe("10.40");
    });
  });

  describe("formatShortDate", () => {
    it("valid date to string", () => {
      expect(formatShortDate("2026-05-04")).toBe("May 4");
    });

    it("invalid date to string", () => {
      expect(formatShortDate("2026-13-04")).toBe("Invalid Date");
    });

    it("valid date to string", () => {
      expect(formatShortDate("2026-12-04")).toBe("Dec 4");
    });
  });

  describe("formatMonthYear", () => {
    it("valid date to string", () => {
      expect(formatMonthYear("2026-05-04")).toBe("May 2026");
    });

    it("invalid date to string", () => {
      expect(formatMonthYear("2026-13-04")).toBe("Invalid Date");
    });

    it("valid date to string", () => {
      expect(formatMonthYear("2036-12-04")).toBe("Dec 2036");
    });
  });
});
