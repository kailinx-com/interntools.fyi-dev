import {
  addSavedLocation,
  hasSavedLocation,
  listSavedLocationDescriptions,
  removeSavedLocation,
  toggleSavedLocation,
} from "./localPlaceBookmarks";

describe("localPlaceBookmarks", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds, lists, and removes descriptions", () => {
    expect(listSavedLocationDescriptions()).toEqual([]);
    addSavedLocation("Seattle, WA, USA");
    expect(listSavedLocationDescriptions()).toEqual(["Seattle, WA, USA"]);
    expect(hasSavedLocation("Seattle, WA, USA")).toBe(true);
    removeSavedLocation("Seattle, WA, USA");
    expect(listSavedLocationDescriptions()).toEqual([]);
  });

  it("toggleSavedLocation returns new bookmark state", () => {
    expect(toggleSavedLocation("Portland, OR")).toBe(true);
    expect(hasSavedLocation("Portland, OR")).toBe(true);
    expect(toggleSavedLocation("Portland, OR")).toBe(false);
    expect(hasSavedLocation("Portland, OR")).toBe(false);
  });

  it("does not duplicate the same description", () => {
    addSavedLocation("Austin, TX");
    addSavedLocation("Austin, TX");
    expect(listSavedLocationDescriptions()).toEqual(["Austin, TX"]);
  });
});
