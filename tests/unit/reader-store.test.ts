import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_FONT_SIZE,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  useReaderStore,
} from "@/stores/reader-store";

describe("reader preferences store", () => {
  beforeEach(() => {
    useReaderStore.setState({ theme: "light", fontSize: DEFAULT_FONT_SIZE });
    localStorage.clear();
  });

  it("changes theme and persists the preference key", () => {
    useReaderStore.getState().setTheme("dark");
    expect(useReaderStore.getState().theme).toBe("dark");
    expect(localStorage.getItem("lumen-reader-preferences")).toContain("dark");
  });

  it("clamps font size to supported bounds", () => {
    useReaderStore.getState().setFontSize(100);
    expect(useReaderStore.getState().fontSize).toBe(MAX_FONT_SIZE);
    useReaderStore.getState().setFontSize(1);
    expect(useReaderStore.getState().fontSize).toBe(MIN_FONT_SIZE);
  });

  it("increments, decrements and resets", () => {
    useReaderStore.getState().increaseFontSize();
    expect(useReaderStore.getState().fontSize).toBe(DEFAULT_FONT_SIZE + 1);
    useReaderStore.getState().decreaseFontSize();
    expect(useReaderStore.getState().fontSize).toBe(DEFAULT_FONT_SIZE);
    useReaderStore.getState().setTheme("sepia");
    useReaderStore.getState().reset();
    expect(useReaderStore.getState()).toMatchObject({
      theme: "light",
      fontSize: DEFAULT_FONT_SIZE,
    });
  });
});
