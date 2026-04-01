export type VisaType = "F1" | "J1" | "M1" | "Other";
export type Residency = "resident" | "nonresident";
export type FicaMode = "exempt" | "withheld";
export type PeriodType = "weekly" | "biweekly" | "monthly";

type TaxBracket = {
  l: number;
  u: number;
  r: number;
};

type StateTaxData = {
  n: string;
  it: boolean;
  sd?: number;
  b?: TaxBracket[];
  sr?: number;
  sc?: number;
};

export { formatMoney, formatShortDate } from "./paycheck-format";

export type PaycheckConfig = {
  startDate: string;
  endDate: string;
  state: string;
  hourlyRate: number;
  workHoursPerDay: number;
  workDaysPerWeek: number;
  stipendPerWeek: number;
  residency: Residency;
  visaType: VisaType;
  arrivalYear: number;
  ficaMode: FicaMode;
};

export type PeriodRow = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  grossTotal: number;
  taxFederal: number;
  taxState: number;
  taxFica: number;
  taxSdi: number;
  netPay: number;
};

export type PayrollResult = {
  weekly: PeriodRow[];
  biweekly: PeriodRow[];
  monthly: PeriodRow[];
  summary: {
    totalGross: number;
    totalFed: number;
    totalState: number;
    totalFica: number;
    totalSdi: number;
    netTotal: number;
    totalDeductions: number;
  };
};

export const DEFAULT_PAYCHECK_CONFIG: PaycheckConfig = {
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
};

export const FEDERAL_STANDARD_DEDUCTION = 15000;
export const FEDERAL_TAX_BRACKETS: TaxBracket[] = [
  { l: 0, u: 11925, r: 0.1 },
  { l: 11925, u: 48475, r: 0.12 },
  { l: 48475, u: 103350, r: 0.22 },
  { l: 103350, u: 197300, r: 0.24 },
  { l: 197300, u: 250525, r: 0.32 },
  { l: 250525, u: 626350, r: 0.35 },
  { l: 626350, u: Number.POSITIVE_INFINITY, r: 0.37 },
];

export const STATE_TAX_DATA: Record<string, StateTaxData> = {
  AL: {
    n: "Alabama",
    it: true,
    sd: 3000,
    b: [
      { l: 0, u: 500, r: 0.02 },
      { l: 500, u: 3000, r: 0.04 },
      { l: 3000, u: 999999999, r: 0.05 },
    ],
  },
  AK: { n: "Alaska", it: false },
  AZ: {
    n: "Arizona",
    it: true,
    sd: 14600,
    b: [{ l: 0, u: 999999999, r: 0.025 }],
  },
  AR: {
    n: "Arkansas",
    it: true,
    sd: 2340,
    b: [
      { l: 0, u: 4499, r: 0.02 },
      { l: 4499, u: 8899, r: 0.04 },
      { l: 8899, u: 999999999, r: 0.044 },
    ],
  },
  CA: {
    n: "California",
    it: true,
    sd: 5363,
    b: [
      { l: 0, u: 10412, r: 0.01 },
      { l: 10412, u: 24684, r: 0.02 },
      { l: 24684, u: 38959, r: 0.04 },
      { l: 38959, u: 54081, r: 0.06 },
      { l: 54081, u: 68350, r: 0.08 },
      { l: 68350, u: 349137, r: 0.093 },
      { l: 349137, u: 418961, r: 0.103 },
      { l: 418961, u: 698271, r: 0.113 },
      { l: 698271, u: 999999999, r: 0.123 },
    ],
    sr: 0.011,
    sc: 153164,
  },
  CO: {
    n: "Colorado",
    it: true,
    sd: 0,
    b: [{ l: 0, u: 999999999, r: 0.0425 }],
  },
  CT: {
    n: "Connecticut",
    it: true,
    sd: 15000,
    b: [
      { l: 0, u: 10000, r: 0.03 },
      { l: 10000, u: 50000, r: 0.05 },
      { l: 50000, u: 100000, r: 0.055 },
      { l: 100000, u: 250000, r: 0.06 },
      { l: 250000, u: 500000, r: 0.065 },
      { l: 500000, u: 999999999, r: 0.0699 },
    ],
  },
  DE: {
    n: "Delaware",
    it: true,
    sd: 3250,
    b: [
      { l: 0, u: 2000, r: 0 },
      { l: 2000, u: 5000, r: 0.022 },
      { l: 5000, u: 10000, r: 0.039 },
      { l: 10000, u: 20000, r: 0.048 },
      { l: 20000, u: 25000, r: 0.052 },
      { l: 25000, u: 60000, r: 0.0555 },
      { l: 60000, u: 999999999, r: 0.066 },
    ],
  },
  DC: {
    n: "District of Columbia",
    it: true,
    sd: 14600,
    b: [
      { l: 0, u: 10000, r: 0.04 },
      { l: 10000, u: 40000, r: 0.06 },
      { l: 40000, u: 60000, r: 0.065 },
      { l: 60000, u: 250000, r: 0.085 },
      { l: 250000, u: 500000, r: 0.0925 },
      { l: 500000, u: 1000000, r: 0.0975 },
      { l: 1000000, u: 999999999, r: 0.1075 },
    ],
  },
  FL: { n: "Florida", it: false },
  GA: {
    n: "Georgia",
    it: true,
    sd: 12000,
    b: [{ l: 0, u: 999999999, r: 0.0539 }],
  },
  HI: {
    n: "Hawaii",
    it: true,
    sd: 2200,
    b: [
      { l: 0, u: 2400, r: 0.014 },
      { l: 2400, u: 4800, r: 0.032 },
      { l: 4800, u: 9600, r: 0.055 },
      { l: 9600, u: 14400, r: 0.064 },
      { l: 14400, u: 19200, r: 0.068 },
      { l: 19200, u: 24000, r: 0.072 },
      { l: 24000, u: 36000, r: 0.076 },
      { l: 36000, u: 48000, r: 0.079 },
      { l: 48000, u: 150000, r: 0.0825 },
      { l: 150000, u: 175000, r: 0.09 },
      { l: 175000, u: 200000, r: 0.1 },
      { l: 200000, u: 999999999, r: 0.11 },
    ],
  },
  ID: {
    n: "Idaho",
    it: true,
    sd: 14600,
    b: [{ l: 0, u: 999999999, r: 0.0569 }],
  },
  IL: {
    n: "Illinois",
    it: true,
    sd: 2425,
    b: [{ l: 0, u: 999999999, r: 0.0495 }],
  },
  IN: {
    n: "Indiana",
    it: true,
    sd: 1000,
    b: [{ l: 0, u: 999999999, r: 0.0305 }],
  },
  IA: {
    n: "Iowa",
    it: true,
    sd: 14600,
    b: [
      { l: 0, u: 6000, r: 0.044 },
      { l: 6000, u: 30000, r: 0.0482 },
      { l: 30000, u: 999999999, r: 0.057 },
    ],
  },
  KS: {
    n: "Kansas",
    it: true,
    sd: 3500,
    b: [
      { l: 0, u: 15000, r: 0.031 },
      { l: 15000, u: 30000, r: 0.0525 },
      { l: 30000, u: 999999999, r: 0.057 },
    ],
  },
  KY: {
    n: "Kentucky",
    it: true,
    sd: 3160,
    b: [{ l: 0, u: 999999999, r: 0.04 }],
  },
  LA: {
    n: "Louisiana",
    it: true,
    sd: 4500,
    b: [
      { l: 0, u: 12500, r: 0.0185 },
      { l: 12500, u: 50000, r: 0.035 },
      { l: 50000, u: 999999999, r: 0.0425 },
    ],
  },
  ME: {
    n: "Maine",
    it: true,
    sd: 14600,
    b: [
      { l: 0, u: 24500, r: 0.058 },
      { l: 24500, u: 60550, r: 0.0715 },
      { l: 60550, u: 999999999, r: 0.0715 },
    ],
  },
  MD: {
    n: "Maryland",
    it: true,
    sd: 2550,
    b: [
      { l: 0, u: 1000, r: 0.02 },
      { l: 1000, u: 2000, r: 0.03 },
      { l: 2000, u: 3000, r: 0.04 },
      { l: 3000, u: 100000, r: 0.0475 },
      { l: 100000, u: 125000, r: 0.05 },
      { l: 125000, u: 150000, r: 0.0525 },
      { l: 150000, u: 250000, r: 0.055 },
      { l: 250000, u: 999999999, r: 0.0575 },
    ],
  },
  MA: {
    n: "Massachusetts",
    it: true,
    sd: 4400,
    b: [
      { l: 0, u: 1000000, r: 0.05 },
      { l: 1000000, u: 999999999, r: 0.09 },
    ],
  },
  MI: {
    n: "Michigan",
    it: true,
    sd: 5400,
    b: [{ l: 0, u: 999999999, r: 0.0425 }],
  },
  MN: {
    n: "Minnesota",
    it: true,
    sd: 14600,
    b: [
      { l: 0, u: 31690, r: 0.0535 },
      { l: 31690, u: 104090, r: 0.068 },
      { l: 104090, u: 193240, r: 0.0785 },
      { l: 193240, u: 999999999, r: 0.0985 },
    ],
  },
  MS: {
    n: "Mississippi",
    it: true,
    sd: 2300,
    b: [
      { l: 0, u: 10000, r: 0 },
      { l: 10000, u: 999999999, r: 0.047 },
    ],
  },
  MO: {
    n: "Missouri",
    it: true,
    sd: 14600,
    b: [
      { l: 0, u: 1273, r: 0 },
      { l: 1273, u: 2546, r: 0.02 },
      { l: 2546, u: 3819, r: 0.025 },
      { l: 3819, u: 5092, r: 0.03 },
      { l: 5092, u: 6365, r: 0.035 },
      { l: 6365, u: 7638, r: 0.04 },
      { l: 7638, u: 8911, r: 0.045 },
      { l: 8911, u: 999999999, r: 0.048 },
    ],
  },
  MT: {
    n: "Montana",
    it: true,
    sd: 14600,
    b: [
      { l: 0, u: 20500, r: 0.047 },
      { l: 20500, u: 999999999, r: 0.059 },
    ],
  },
  NE: {
    n: "Nebraska",
    it: true,
    sd: 8000,
    b: [
      { l: 0, u: 3700, r: 0.0246 },
      { l: 3700, u: 22170, r: 0.0351 },
      { l: 22170, u: 35730, r: 0.0501 },
      { l: 35730, u: 999999999, r: 0.0584 },
    ],
  },
  NV: { n: "Nevada", it: false },
  NH: { n: "New Hampshire", it: false },
  NJ: {
    n: "New Jersey",
    it: true,
    sd: 1000,
    b: [
      { l: 0, u: 20000, r: 0.014 },
      { l: 20000, u: 35000, r: 0.0175 },
      { l: 35000, u: 40000, r: 0.035 },
      { l: 40000, u: 75000, r: 0.05525 },
      { l: 75000, u: 500000, r: 0.0637 },
      { l: 500000, u: 1000000, r: 0.0897 },
      { l: 1000000, u: 999999999, r: 0.1075 },
    ],
  },
  NM: {
    n: "New Mexico",
    it: true,
    sd: 14600,
    b: [
      { l: 0, u: 5500, r: 0.017 },
      { l: 5500, u: 11000, r: 0.032 },
      { l: 11000, u: 16000, r: 0.047 },
      { l: 16000, u: 210000, r: 0.049 },
      { l: 210000, u: 999999999, r: 0.059 },
    ],
  },
  NY: {
    n: "New York",
    it: true,
    sd: 8000,
    b: [
      { l: 0, u: 8500, r: 0.04 },
      { l: 8500, u: 11700, r: 0.045 },
      { l: 11700, u: 13900, r: 0.0525 },
      { l: 13900, u: 107650, r: 0.0585 },
      { l: 107650, u: 269300, r: 0.0625 },
      { l: 269300, u: 1077550, r: 0.0685 },
      { l: 1077550, u: 5000000, r: 0.0965 },
      { l: 5000000, u: 25000000, r: 0.103 },
      { l: 25000000, u: 999999999, r: 0.109 },
    ],
  },
  NC: {
    n: "North Carolina",
    it: true,
    sd: 12750,
    b: [{ l: 0, u: 999999999, r: 0.045 }],
  },
  ND: {
    n: "North Dakota",
    it: true,
    sd: 14600,
    b: [
      { l: 0, u: 44725, r: 0.011 },
      { l: 44725, u: 225975, r: 0.0204 },
      { l: 225975, u: 999999999, r: 0.025 },
    ],
  },
  OH: {
    n: "Ohio",
    it: true,
    sd: 0,
    b: [
      { l: 0, u: 26050, r: 0 },
      { l: 26050, u: 100000, r: 0.0275 },
      { l: 100000, u: 999999999, r: 0.035 },
    ],
  },
  OK: {
    n: "Oklahoma",
    it: true,
    sd: 6350,
    b: [
      { l: 0, u: 1000, r: 0.0025 },
      { l: 1000, u: 2500, r: 0.0075 },
      { l: 2500, u: 3750, r: 0.0175 },
      { l: 3750, u: 4900, r: 0.0275 },
      { l: 4900, u: 7200, r: 0.0375 },
      { l: 7200, u: 999999999, r: 0.0475 },
    ],
  },
  OR: {
    n: "Oregon",
    it: true,
    sd: 2605,
    b: [
      { l: 0, u: 4050, r: 0.0475 },
      { l: 4050, u: 10200, r: 0.0675 },
      { l: 10200, u: 125000, r: 0.0875 },
      { l: 125000, u: 999999999, r: 0.099 },
    ],
  },
  PA: {
    n: "Pennsylvania",
    it: true,
    sd: 0,
    b: [{ l: 0, u: 999999999, r: 0.0307 }],
  },
  RI: {
    n: "Rhode Island",
    it: true,
    sd: 10000,
    b: [
      { l: 0, u: 73450, r: 0.0375 },
      { l: 73450, u: 166950, r: 0.0475 },
      { l: 166950, u: 999999999, r: 0.0599 },
    ],
  },
  SC: {
    n: "South Carolina",
    it: true,
    sd: 14600,
    b: [
      { l: 0, u: 3460, r: 0 },
      { l: 3460, u: 17330, r: 0.064 },
      { l: 17330, u: 999999999, r: 0.064 },
    ],
  },
  SD: { n: "South Dakota", it: false },
  TN: { n: "Tennessee", it: false },
  TX: { n: "Texas", it: false },
  UT: {
    n: "Utah",
    it: true,
    sd: 14600,
    b: [{ l: 0, u: 999999999, r: 0.0465 }],
  },
  VT: {
    n: "Vermont",
    it: true,
    sd: 6800,
    b: [
      { l: 0, u: 43500, r: 0.0335 },
      { l: 43500, u: 105000, r: 0.066 },
      { l: 105000, u: 219000, r: 0.076 },
      { l: 219000, u: 999999999, r: 0.0875 },
    ],
  },
  VA: {
    n: "Virginia",
    it: true,
    sd: 8900,
    b: [
      { l: 0, u: 3000, r: 0.02 },
      { l: 3000, u: 5000, r: 0.03 },
      { l: 5000, u: 17000, r: 0.05 },
      { l: 17000, u: 999999999, r: 0.0575 },
    ],
  },
  WA: { n: "Washington", it: false, sr: 0.0058, sc: 168600 },
  WV: {
    n: "West Virginia",
    it: true,
    sd: 0,
    b: [
      { l: 0, u: 10000, r: 0.0236 },
      { l: 10000, u: 25000, r: 0.0315 },
      { l: 25000, u: 40000, r: 0.0354 },
      { l: 40000, u: 60000, r: 0.0472 },
      { l: 60000, u: 999999999, r: 0.0512 },
    ],
  },
  WI: {
    n: "Wisconsin",
    it: true,
    sd: 12560,
    b: [
      { l: 0, u: 14320, r: 0.035 },
      { l: 14320, u: 28640, r: 0.044 },
      { l: 28640, u: 315460, r: 0.053 },
      { l: 315460, u: 999999999, r: 0.0765 },
    ],
  },
  WY: { n: "Wyoming", it: false },
  Other: { n: "Other / International", it: false },
};

export function deriveFicaMode(
  config: Pick<PaycheckConfig, "visaType" | "arrivalYear">,
): FicaMode {
  if (["F1", "J1", "M1"].includes(config.visaType)) {
    const yearsInUs = new Date().getUTCFullYear() - config.arrivalYear;
    return yearsInUs < 5 ? "exempt" : "withheld";
  }
  return "withheld";
}

export function calculateTax(income: number, brackets: TaxBracket[]): number {
  if (income <= 0) return 0;
  let tax = 0;
  for (const bracket of brackets) {
    if (income > bracket.l) {
      tax += (Math.min(income, bracket.u) - bracket.l) * bracket.r;
    }
  }
  return tax;
}

export function getBusinessDays(startDate: string, endDate: string): number {
  let count = 0;
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count += 1;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function getSplitEnd(date: Date, periodType: PeriodType): Date {
  const cursor = new Date(date);
  if (periodType === "monthly") {
    return new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 12, 0, 0);
  }
  if (periodType === "weekly") {
    const day = cursor.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    cursor.setDate(cursor.getDate() + diff);
    return cursor;
  }
  cursor.setDate(cursor.getDate() + 13);
  return cursor;
}

function labelForPeriod(type: PeriodType, index: number): string {
  if (type === "weekly") return `Week ${index}`;
  if (type === "biweekly") return `Biweek ${index}`;
  return `Month ${index}`;
}

export function calculatePayroll(config: PaycheckConfig): PayrollResult {
  const totalDays = getBusinessDays(config.startDate, config.endDate);
  const dailyRate = config.hourlyRate * config.workHoursPerDay;
  const grossWages = dailyRate * totalDays;
  const totalWeeks = totalDays / config.workDaysPerWeek;
  const grossStipend = config.stipendPerWeek * totalWeeks;
  const totalGross = grossWages + grossStipend;

  const fedTaxable = Math.max(
    0,
    totalGross -
      (config.residency === "resident" ? FEDERAL_STANDARD_DEDUCTION : 0),
  );
  const totalFed = calculateTax(fedTaxable, FEDERAL_TAX_BRACKETS);

  const stateData = STATE_TAX_DATA[config.state];
  let totalState = 0;
  let totalSdi = 0;
  if (stateData) {
    if (stateData.it && stateData.b) {
      totalState = calculateTax(
        Math.max(0, totalGross - (stateData.sd ?? 0)),
        stateData.b,
      );
    }
    if (stateData.sr && stateData.sc) {
      totalSdi = Math.min(totalGross, stateData.sc) * stateData.sr;
    }
  }

  const totalFica =
    config.ficaMode === "withheld"
      ? Math.min(grossWages, 176100) * 0.062 + grossWages * 0.0145
      : 0;

  const netTotal = totalGross - (totalFed + totalState + totalFica + totalSdi);

  const effectiveFed = totalGross > 0 ? totalFed / totalGross : 0;
  const effectiveState = totalGross > 0 ? totalState / totalGross : 0;
  const effectiveFica = totalGross > 0 ? totalFica / totalGross : 0;
  const effectiveSdi = totalGross > 0 ? totalSdi / totalGross : 0;

  const buildRows = (periodType: PeriodType): PeriodRow[] => {
    const rows: PeriodRow[] = [];
    const end = new Date(`${config.endDate}T12:00:00`);
    let current = new Date(`${config.startDate}T12:00:00`);
    let idx = 1;

    while (current <= end) {
      let periodEnd = getSplitEnd(current, periodType);
      if (periodEnd > end) periodEnd = new Date(end);

      const startIso = current.toISOString().split("T")[0];
      const endIso = periodEnd.toISOString().split("T")[0];
      const periodDays = getBusinessDays(startIso, endIso);
      const periodWeeks = periodDays / config.workDaysPerWeek;
      const periodGross =
        dailyRate * periodDays + config.stipendPerWeek * periodWeeks;
      const periodRate =
        effectiveFed + effectiveState + effectiveFica + effectiveSdi;

      rows.push({
        id: `${periodType}-${idx}`,
        label: labelForPeriod(periodType, idx),
        startDate: startIso,
        endDate: endIso,
        grossTotal: periodGross,
        taxFederal: periodGross * effectiveFed,
        taxState: periodGross * effectiveState,
        taxFica: periodGross * effectiveFica,
        taxSdi: periodGross * effectiveSdi,
        netPay: periodGross * (1 - periodRate),
      });

      idx += 1;
      current = new Date(periodEnd);
      current.setDate(current.getDate() + 1);
    }

    return rows;
  };

  return {
    weekly: buildRows("weekly"),
    biweekly: buildRows("biweekly"),
    monthly: buildRows("monthly"),
    summary: {
      totalGross,
      totalFed,
      totalState,
      totalFica,
      totalSdi,
      netTotal,
      totalDeductions: totalFed + totalState + totalFica + totalSdi,
    },
  };
}
