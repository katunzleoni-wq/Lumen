import type { Locale } from "@/i18n";
import type { Book } from "@/content/books";
import { cn } from "@/lib/utils";
import { BookCard } from "./book-card";

interface BookGridProps {
  books: Book[];
  locale: Locale;
  layout?: "grid" | "list";
  className?: string;
  priorityCount?: number;
}

export function BookGrid({
  books,
  locale,
  layout = "grid",
  className,
  priorityCount = 0,
}: BookGridProps) {
  return (
    <div
      className={cn(
        layout === "grid"
          ? "grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-7 lg:grid-cols-4 lg:gap-x-8"
          : "flex flex-col gap-8",
        className,
      )}
    >
      {books.map((book, index) => (
        <BookCard
          key={book.id}
          book={book}
          locale={locale}
          layout={layout}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}
