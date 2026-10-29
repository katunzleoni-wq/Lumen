import { ArrowUpRight, Clock3 } from "lucide-react";
import type { Locale } from "@/i18n";
import { getCategoryName, type Book } from "@/content/books";
import { Link } from "@/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { BookCover } from "./book-cover";
import { FavoriteButton } from "@/components/site/favorite-button";

interface BookCardProps {
  book: Book;
  locale: Locale;
  layout?: "grid" | "list";
  priority?: boolean;
}

export function BookCard({ book, locale, layout = "grid", priority = false }: BookCardProps) {
  const t = useTranslations();
  const title = book.title[book.language];
  const description = book.description[book.language];
  const isList = layout === "list";

  return (
    <article
      className={cn(
        "group relative",
        isList && "grid grid-cols-[7.5rem_1fr] gap-5 sm:grid-cols-[10rem_1fr] sm:gap-7",
      )}
      data-testid="book-card"
      data-book-slug={book.slug}
    >
      <div className={cn("relative", !isList && "mb-5")}>
        <Link
          href={`/livro/${book.slug}`}
          className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
          aria-label={t("a11y.openReader", { title })}
        >
          <BookCover
            slug={book.slug}
            title={title}
            alt={t("a11y.bookCover", { title })}
            priority={priority}
            className={cn(
              "transition-transform duration-500 ease-out",
              !isList && "group-hover:-translate-y-1.5 group-hover:rotate-[0.5deg]",
            )}
            sizes={isList ? "160px" : "(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 280px"}
          />
        </Link>
        <div className="absolute right-2.5 top-2.5 z-10">
          <FavoriteButton bookId={book.id} title={title} />
        </div>
      </div>

      <div className={cn("flex min-w-0 flex-col", isList && "justify-center py-1")}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-gold-700">
            {getCategoryName(book.category, locale)}
          </span>
          <span className="size-0.5 rounded-full bg-border" aria-hidden="true" />
          <span className="text-[0.68rem] text-muted-foreground">{book.year}</span>
          <Badge variant="muted" className="px-2 py-0.5 text-[0.58rem] uppercase">
            {book.language}
          </Badge>
        </div>
        <h3 className="font-serif text-xl font-medium leading-snug tracking-[-0.01em] text-foreground sm:text-[1.35rem]">
          <Link
            href={`/livro/${book.slug}`}
            className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
        {isList && (
          <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.7rem] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5 text-gold-600" aria-hidden="true" />
            {t("common.minutes", { minutes: book.readingMinutes })}
          </span>
          <span className="flex items-center gap-1.5">
            {book.formats.map((format) => (
              <Badge key={format} variant="outline" className="px-2 py-0.5 text-[0.58rem]">
                {format.toUpperCase()}
              </Badge>
            ))}
          </span>
          <Link
            href={`/livro/${book.slug}`}
            className="ml-auto hidden items-center gap-1 text-[0.7rem] font-semibold text-primary group-hover:inline-flex"
          >
            {t("common.read")}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
