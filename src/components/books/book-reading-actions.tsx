"use client";

import { BookOpen, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { useReadingProgress } from "@/lib/use-library";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/site/favorite-button";
import { ShareButton } from "./share-button";

interface BookReadingActionsProps {
  bookId: string;
  slug: string;
  title: string;
}

export function BookReadingActions({ bookId, slug, title }: BookReadingActionsProps) {
  const t = useTranslations();
  const epubProgress = useReadingProgress(bookId, "epub");
  const pdfProgress = useReadingProgress(bookId, "pdf");

  const latest =
    [epubProgress, pdfProgress]
      .filter((progress) => progress !== undefined)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
  const hasProgress = Boolean(latest && latest.percent > 0);
  const href = latest ? `/ler/${slug}?formato=${latest.format}` : `/ler/${slug}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <Button asChild size="lg" className="flex-1">
          <Link href={href}>
            {hasProgress ? (
              <Play className="size-4 fill-current" aria-hidden="true" />
            ) : (
              <BookOpen className="size-4" aria-hidden="true" />
            )}
            {hasProgress ? t("book.progressContinue") : t("book.readSample")}
          </Link>
        </Button>
        <FavoriteButton bookId={bookId} title={title} variant="full" className="h-[3.25rem]" />
      </div>

      {latest && latest.percent > 0 && (
        <div className="space-y-1.5" aria-live="polite">
          <div className="flex items-center justify-between text-[0.68rem] text-muted-foreground">
            <span>{t("book.progressPercent", { percent: latest.percent })}</span>
            <span className="uppercase tracking-[0.12em]">{latest.format}</span>
          </div>
          <div
            className="h-1 overflow-hidden rounded-full bg-papyrus-200"
            role="progressbar"
            aria-valuenow={latest.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("a11y.readingProgress")}
          >
            <div
              className="h-full rounded-full bg-gold-500 transition-[width] duration-500"
              style={{ width: `${latest.percent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border/60 pt-2">
        <p className="text-[0.68rem] text-muted-foreground">{t("book.savedOffline")}</p>
        <ShareButton title={title} />
      </div>
    </div>
  );
}
