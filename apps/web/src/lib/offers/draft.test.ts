import {
  saveCompareOffersDraft,
  getCompareOffersDraft,
  clearCompareOffersDraft,
  CompareOffersDraft,
} from "./draft";

describe("offers draft storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("saveCompareOffersDraft", () => {
    it("stores the draft in localStorage", () => {
      const draft: CompareOffersDraft = {
        offers: [
          { id: "a", company: "Google", role: "SWE", compensation: "$8k/mo" },
          { id: "b", company: "Meta", role: "SWE", compensation: "$9k/mo" },
        ],
      };

      saveCompareOffersDraft(draft);

      const raw = window.localStorage.getItem("offers-compare-draft");
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!)).toEqual(draft);
    });
  });

  describe("getCompareOffersDraft", () => {
    it("returns null when nothing is stored", () => {
      expect(getCompareOffersDraft()).toBeNull();
    });

    it("returns the stored draft", () => {
      const draft: CompareOffersDraft = {
        offers: [{ id: "x", company: "Acme", role: "PM", compensation: "$7k/mo" }],
      };
      window.localStorage.setItem("offers-compare-draft", JSON.stringify(draft));

      expect(getCompareOffersDraft()).toEqual(draft);
    });

    it("returns null for invalid JSON", () => {
      window.localStorage.setItem("offers-compare-draft", "not-json");

      expect(getCompareOffersDraft()).toBeNull();
    });
  });

  describe("clearCompareOffersDraft", () => {
    it("removes the draft from localStorage", () => {
      window.localStorage.setItem("offers-compare-draft", "{}");

      clearCompareOffersDraft();

      expect(window.localStorage.getItem("offers-compare-draft")).toBeNull();
    });
  });
});
