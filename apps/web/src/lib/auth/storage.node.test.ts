

import { clearStoredToken, getStoredToken, setStoredToken } from "./storage";

describe("auth storage (no window)", () => {
  it("returns null for token when window is undefined", () => {
    expect(getStoredToken()).toBeNull();
  });

  it("no-ops set and clear when window is undefined", () => {
    setStoredToken("x");
    clearStoredToken();
    expect(getStoredToken()).toBeNull();
  });
});
