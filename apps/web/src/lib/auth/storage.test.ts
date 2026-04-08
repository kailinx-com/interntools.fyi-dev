import { clearStoredToken, getStoredToken, setStoredToken } from "./storage";

describe("auth storage", () => {
  const key = "interntools.auth.token";

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("writes and reads token from localStorage", () => {
    setStoredToken("abc123");
    expect(window.localStorage.getItem(key)).toBe("abc123");
    expect(getStoredToken()).toBe("abc123");
  });

  it("clears token from localStorage", () => {
    window.localStorage.setItem(key, "abc123");
    clearStoredToken();
    expect(getStoredToken()).toBeNull();
  });
});
