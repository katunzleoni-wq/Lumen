import Dexie, { type Table } from "dexie";
import type { BookFormat } from "@/content/books";

export interface FavoriteRecord {
  bookId: string;
  addedAt: number;
}

export interface ReadingProgressRecord {
  id: string;
  bookId: string;
  format: BookFormat;
  location: string | null;
  page: number;
  totalPages: number;
  percent: number;
  updatedAt: number;
}

export interface NewsletterRecord {
  email: string;
  createdAt: number;
}

class LumenDatabase extends Dexie {
  favorites!: Table<FavoriteRecord, string>;
  readingProgress!: Table<ReadingProgressRecord, string>;
  newsletter!: Table<NewsletterRecord, string>;

  constructor() {
    super("lumen-library");
    this.version(1).stores({
      favorites: "bookId, addedAt",
      readingProgress: "id, bookId, format, updatedAt",
      newsletter: "email, createdAt",
    });
  }
}

export const db = new LumenDatabase();

export async function toggleFavorite(bookId: string): Promise<boolean> {
  return db.transaction("rw", db.favorites, async () => {
    const existing = await db.favorites.get(bookId);
    if (existing) {
      await db.favorites.delete(bookId);
      return false;
    }
    await db.favorites.put({ bookId, addedAt: Date.now() });
    return true;
  });
}

export function progressId(bookId: string, format: BookFormat) {
  return `${bookId}:${format}`;
}

export async function getReadingProgress(bookId: string, format: BookFormat) {
  return db.readingProgress.get(progressId(bookId, format));
}

export async function saveReadingProgress(record: Omit<ReadingProgressRecord, "id" | "updatedAt">) {
  const id = progressId(record.bookId, record.format);
  const existing = await db.readingProgress.get(id);
  if (existing && existing.updatedAt > Date.now() - 800 && existing.location === record.location) {
    return;
  }
  await db.readingProgress.put({
    ...record,
    id,
    updatedAt: Date.now(),
  });
}

export async function saveNewsletterEmail(email: string) {
  const normalized = email.trim().toLocaleLowerCase();
  await db.newsletter.put({ email: normalized, createdAt: Date.now() });
}
