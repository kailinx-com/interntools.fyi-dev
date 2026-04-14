import { postLocationLine, uniqueOfficeLocationsFromOffers } from "./postLocationDisplay";
import type { Offer } from "./api";

function offer(partial: Partial<Offer> & Pick<Offer, "id" | "company">): Offer {
  return {
    title: "",
    employmentType: null,
    compensationType: null,
    payAmount: null,
    hoursPerWeek: null,
    signOnBonus: null,
    relocationAmount: null,
    equityNotes: null,
    daysInOffice: null,
    notes: null,
    favorite: null,
    createdAt: "",
    updatedAt: "",
    ...partial,
  };
}

describe("postLocationDisplay", () => {
  it("uniqueOfficeLocationsFromOffers dedupes case-insensitively", () => {
    expect(
      uniqueOfficeLocationsFromOffers([
        offer({ id: 1, company: "A", officeLocation: "Seattle, WA" }),
        offer({ id: 2, company: "B", officeLocation: "seattle, wa" }),
        offer({ id: 3, company: "C", officeLocation: "SF" }),
      ]),
    ).toEqual(["Seattle, WA", "SF"]);
  });

  it("postLocationLine uses offers for comparison type", () => {
    expect(
      postLocationLine(
        "comparison",
        "Ignored post loc",
        [offer({ id: 1, company: "A", officeLocation: "NYC" })],
      ),
    ).toBe("NYC");
  });

  it("postLocationLine uses post office for acceptance", () => {
    expect(postLocationLine("acceptance", "Portland, OR", [])).toBe("Portland, OR");
  });

  it("uniqueOfficeLocationsFromOffers treats null list like empty", () => {
    expect(uniqueOfficeLocationsFromOffers(null)).toEqual([]);
  });

  it("postLocationLine returns null for acceptance with blank post location", () => {
    expect(postLocationLine("acceptance", "   ", [])).toBeNull();
  });
});
