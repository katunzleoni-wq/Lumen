"use client";

import { Bookmark, HardDrive, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { books, type Book } from "@/content/books";
import type { Locale } from "@/i18n";
import { Link } from "@/navigation";
import { useFavorites } from "@/lib/use-library";
import { BookGrid } from "@/components/books/book-grid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function FavoritesView({ locale }: { locale: Locale }) {
  const t = useTranslations();
  const favorites = useFavorites();

  const savedBooks = (favorites ?? [])
    .map((favorite) => books.find((book) => book.id === favorite.bookId))
    .filter((book): book is Book => Boolean(book));

  if (!favorites) {
    return (
      <div className="mt-10 grid grid-cols-2 gap-8 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="aspect-[2/3] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (savedBooks.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center rounded-[2rem] border border-dashed border-border bg-card/55 px-6 py-20 text-center">
        <span className="grid size-20 place-items-center rounded-full border border-border bg-background text-gold-600">
          <Bookmark className="size-8" strokeWidth={1.3} aria-hidden="true" />
        </span>
        <h2 className="mt-7 font-serif text-3xl font-medium tracking-[-0.02em]">
          {t("favorites.emptyTitle")}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t("favorites.emptyBody")}
        </p>
        <Button asChild className="mt-7">
          <Link href="/biblioteca">
            <Search className="size-4" aria-hidden="true" />
            {t("favorites.browse")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-5">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {t("favorites.count", { count: savedBooks.length })}
        </p>
        <p className="flex items-center gap-2 text-[0.66rem] text-muted-foreground">
          <HardDrive className="size-3.5 text-gold-600" aria-hidden="true" />
          {t("favorites.localNote")}
        </p>
      </div>
      <div className="mt-10">
        <BookGrid books={savedBooks} locale={locale} />
      </div>
    </>
  );
}
