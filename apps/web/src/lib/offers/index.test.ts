import {
  clearCompareOffersDraft,
  getCompareOffersDraft,
  saveCompareOffersDraft,
} from "./index";

describe("offers barrel", () => {
  it("re-exports draft helpers", () => {
    expect(typeof saveCompareOffersDraft).toBe("function");
    expect(typeof getCompareOffersDraft).toBe("function");
    expect(typeof clearCompareOffersDraft).toBe("function");
  });
});
