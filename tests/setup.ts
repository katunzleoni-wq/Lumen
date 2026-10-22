import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);
vi.stubGlobal("scrollTo", vi.fn());

if (!window.HTMLElement.prototype.hasPointerCapture) {
  Object.defineProperty(window.HTMLElement.prototype, "hasPointerCapture", {
    value: () => false,
  });
}

if (!window.HTMLElement.prototype.scrollIntoView) {
  Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
    value: () => undefined,
  });
}
