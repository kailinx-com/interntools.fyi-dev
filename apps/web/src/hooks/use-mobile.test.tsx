import { renderHook, waitFor } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

function mockViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });

  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: width < 768,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

describe("useIsMobile", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("returns false when viewport is wide", async () => {
    mockViewport(1024);
    const { result } = renderHook(() => useIsMobile());
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("returns true when viewport is narrow", async () => {
    mockViewport(500);
    const { result } = renderHook(() => useIsMobile());
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});
