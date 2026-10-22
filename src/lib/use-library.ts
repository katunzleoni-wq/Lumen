"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";

export function useFavoriteCount() {
  return useLiveQuery(() => db.favorites.count(), [], 0);
}

export function useFavorite(bookId: string) {
  return useLiveQuery(() => db.favorites.get(bookId), [bookId], undefined);
}

export function useFavorites() {
  return useLiveQuery(() => db.favorites.orderBy("addedAt").reverse().toArray(), [], []);
}

export function useReadingProgress(bookId: string, format: "epub" | "pdf") {
  return useLiveQuery(
    () => db.readingProgress.get(`${bookId}:${format}`),
    [bookId, format],
    undefined,
  );
}
