

import {
  clearCompareOffersDraft,
  getCompareOffersDraft,
  saveCompareOffersDraft,
} from "./draft";

describe("offers compare draft (no window)", () => {
  it("returns null and no-ops when window is undefined", () => {
    expect(getCompareOffersDraft()).toBeNull();
    saveCompareOffersDraft({ offers: [] });
    clearCompareOffersDraft();
    expect(getCompareOffersDraft()).toBeNull();
  });
});
