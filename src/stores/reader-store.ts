"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clamp } from "@/lib/utils";

export type ReaderTheme = "light" | "sepia" | "dark";

interface ReaderState {
  theme: ReaderTheme;
  fontSize: number;
  setTheme: (theme: ReaderTheme) => void;
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  reset: () => void;
}

export const DEFAULT_FONT_SIZE = 18;
export const MIN_FONT_SIZE = 14;
export const MAX_FONT_SIZE = 28;

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      theme: "light",
      fontSize: DEFAULT_FONT_SIZE,
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize: clamp(fontSize, MIN_FONT_SIZE, MAX_FONT_SIZE) }),
      increaseFontSize: () =>
        set((state) => ({ fontSize: clamp(state.fontSize + 1, MIN_FONT_SIZE, MAX_FONT_SIZE) })),
      decreaseFontSize: () =>
        set((state) => ({ fontSize: clamp(state.fontSize - 1, MIN_FONT_SIZE, MAX_FONT_SIZE) })),
      reset: () => set({ theme: "light", fontSize: DEFAULT_FONT_SIZE }),
    }),
    {
      name: "lumen-reader-preferences",
      version: 1,
      partialize: (state) => ({ theme: state.theme, fontSize: state.fontSize }),
    },
  ),
);

export const READER_THEMES: Record<
  ReaderTheme,
  { paper: string; ink: string; muted: string; accent: string; chrome: string }
> = {
  light: {
    paper: "#fbf8f0",
    ink: "#26322e",
    muted: "#66736d",
    accent: "#8a6b37",
    chrome: "#f4efe4",
  },
  sepia: {
    paper: "#f3e6cf",
    ink: "#4a3826",
    muted: "#7b674e",
    accent: "#96672e",
    chrome: "#e9d9bd",
  },
  dark: {
    paper: "#151b19",
    ink: "#ddd6c7",
    muted: "#9ca8a1",
    accent: "#c7a86b",
    chrome: "#1c2421",
  },
};
