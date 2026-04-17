import "@testing-library/jest-dom";
import "whatwg-fetch";

jest.setTimeout(15_000);

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(global, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

if (typeof window !== "undefined" && window.HTMLElement?.prototype) {
  Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
    writable: true,
    value: jest.fn(),
  });
}
