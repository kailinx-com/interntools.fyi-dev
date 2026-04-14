import { offerToPostSubmitPrefill } from "./offerPostPrefill";
import type { Offer } from "./api";

function baseOffer(over: Partial<Offer> = {}): Offer {
  return {
    id: 1,
    company: "Acme",
    title: "SWE Intern",
    employmentType: "internship",
    compensationType: "hourly",
    payAmount: 45,
    hoursPerWeek: 40,
    signOnBonus: 1000,
    relocationAmount: null,
    equityNotes: null,
    officeLocation: "Seattle, WA",
    daysInOffice: 2,
    notes: null,
    favorite: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    ...over,
  };
}

describe("offerToPostSubmitPrefill", () => {
  it("builds title, location, company, role, compensation, and detail notes", () => {
    const p = offerToPostSubmitPrefill(baseOffer());
    expect(p.title).toBe("Acme — SWE Intern");
    expect(p.officeLocation).toBe("Seattle, WA");
    expect(p.singleCompany).toBe("Acme");
    expect(p.singleRole).toBe("SWE Intern");
    expect(p.compensation).toBe("$45/hr");
    expect(p.notes).toContain("Employment: internship");
    expect(p.notes).toContain("Hours per week: 40");
    expect(p.notes).toContain("Days in office: 2");
    expect(p.notes).toContain("Sign-on bonus: $1,000");
  });

  it("uses plain-text notes when notes are not JSON", () => {
    const p = offerToPostSubmitPrefill(
      baseOffer({ notes: "Met the team remotely." }),
    );
    expect(p.notes).toContain("Met the team remotely.");
  });

  it("ignores JSON structured notes for the notes field but still adds detail lines", () => {
    const p = offerToPostSubmitPrefill(
      baseOffer({ notes: '{"netTakeHome":"$4k"}' }),
    );
    expect(p.notes).not.toContain("netTakeHome");
    expect(p.notes).toContain("Employment:");
  });

  it("falls back title when company and role are empty", () => {
    const p = offerToPostSubmitPrefill(
      baseOffer({ company: "", title: "", officeLocation: null }),
    );
    expect(p.title).toBe("Offer update");
  });

  it("formats monthly compensation like the rest of the app", () => {
    const p = offerToPostSubmitPrefill(
      baseOffer({
        compensationType: "monthly",
        payAmount: 8500,
      }),
    );
    expect(p.compensation).toBe("$8,500/mo");
  });

  it("includes relocation and equity in detail notes", () => {
    const p = offerToPostSubmitPrefill(
      baseOffer({
        relocationAmount: 5000,
        equityNotes: "4yr vest",
        signOnBonus: null,
      }),
    );
    expect(p.notes).toContain("Relocation: $5,000");
    expect(p.notes).toContain("Equity: 4yr vest");
    expect(p.notes).not.toContain("Sign-on bonus");
  });

  it("trims whitespace on company, title, and office location", () => {
    const p = offerToPostSubmitPrefill(
      baseOffer({
        company: "  TrimCo  ",
        title: "  PM  ",
        officeLocation: "  Austin  ",
      }),
    );
    expect(p.title).toBe("TrimCo — PM");
    expect(p.singleCompany).toBe("TrimCo");
    expect(p.singleRole).toBe("PM");
    expect(p.officeLocation).toBe("Austin");
  });
});
