"use client";

import dynamic from "next/dynamic";
import { ArrowLeft, Check, Download, Maximize2, Minimize2, Settings2, Type } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import type { Book, BookFormat } from "@/content/books";
import {
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  READER_THEMES,
  useReaderStore,
  type ReaderTheme,
} from "@/stores/reader-store";
import { getReadingProgress } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReaderLoading } from "./reader-loading";

const EpubReader = dynamic(() => import("./epub-reader"), {
  ssr: false,
  loading: () => <ReaderLoading />,
});

const PdfReader = dynamic(() => import("./pdf-reader"), {
  ssr: false,
  loading: () => <ReaderLoading />,
});

interface ReaderExperienceProps {
  book: Book;
  initialFormat: BookFormat;
}

export function ReaderExperience({ book, initialFormat }: ReaderExperienceProps) {
  const t = useTranslations("reader");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const theme = useReaderStore((state) => state.theme);
  const fontSize = useReaderStore((state) => state.fontSize);
  const setTheme = useReaderStore((state) => state.setTheme);
  const increaseFontSize = useReaderStore((state) => state.increaseFontSize);
  const decreaseFontSize = useReaderStore((state) => state.decreaseFontSize);
  const [mounted, setMounted] = useState(false);
  const [format, setFormat] = useState<BookFormat>(initialFormat);
  const [progress, setProgress] = useState<Record<BookFormat, number>>({ epub: 0, pdf: 0 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const chrome = READER_THEMES[theme].chrome;
  const paper = READER_THEMES[theme].paper;

  useEffect(() => {
    setMounted(true);
    Promise.all([getReadingProgress(book.id, "epub"), getReadingProgress(book.id, "pdf")])
      .then(([epub, pdf]) => {
        setProgress({ epub: epub?.percent ?? 0, pdf: pdf?.percent ?? 0 });
      })
      .catch(() => {
        // Reading remains fully available if local persistence is blocked.
      });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [book.id]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
      if (event.key.toLocaleLowerCase() === "f") {
        event.preventDefault();
        void toggleFullscreen();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleFullscreen]);

  const handleProgress = useCallback(
    (value: number) => {
      setProgress((current) =>
        current[format] === value ? current : { ...current, [format]: value },
      );
    },
    [format],
  );

  function changeFormat(next: BookFormat) {
    if (next === format) return;
    setFormat(next);
    const url = new URL(window.location.href);
    url.searchParams.set("formato", next);
    window.history.replaceState({}, "", url);
  }

  if (!mounted) {
    return (
      <main
        id="main-content"
        className="fixed inset-0 z-50 flex h-[100dvh] items-center justify-center bg-background"
      >
        <ReaderLoading />
      </main>
    );
  }

  const title = book.title[locale as keyof typeof book.title] ?? book.title.pt;
  const fileUrl = `/books/${book.slug}.${format}`;

  return (
    <main
      id="main-content"
      ref={shellRef}
      data-testid="reader-shell"
      data-reader-format={format}
      className="fixed inset-0 z-50 flex h-[100dvh] flex-col"
      style={{ background: paper, color: READER_THEMES[theme].ink }}
    >
      <header
        className="flex h-16 shrink-0 items-center gap-2 border-b border-black/10 px-2 sm:gap-4 sm:px-5"
        style={{ background: chrome }}
      >
        <Link
          href={`/livro/${book.slug}`}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-2.5 text-xs font-semibold text-foreground/80 transition-colors hover:bg-black/5 hover:text-foreground sm:px-3"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t("backToBook")}</span>
          <span className="sr-only sm:hidden">{t("backToBook")}</span>
        </Link>

        <div className="min-w-0 flex-1 border-l border-black/10 pl-3 sm:pl-4">
          <p className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-gold-700">
            Lumen
          </p>
          <h1 className="mt-0.5 truncate font-serif text-sm font-medium sm:text-base">{title}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {book.formats.length > 1 && (
            <div
              className="flex items-center rounded-full border border-black/10 bg-white/40 p-0.5"
              role="group"
              aria-label={t("format")}
            >
              {book.formats.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeFormat(item)}
                  aria-pressed={format === item}
                  className={
                    format === item
                      ? "rounded-full bg-primary px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-primary-foreground"
                      : "rounded-full px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                  }
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          <span className="hidden items-center gap-1.5 text-[0.65rem] text-muted-foreground md:flex">
            <span className="size-1.5 rounded-full bg-forest-500" aria-hidden="true" />
            {t("progress", { percent: progress[format] })}
          </span>

          <a
            href={fileUrl}
            download
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
            aria-label={t("downloadFile")}
          >
            <Download className="size-4" aria-hidden="true" />
          </a>

          {format === "epub" && (
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("settings")}
                  className="text-foreground hover:bg-black/5"
                >
                  <Settings2 className="size-4" aria-hidden="true" />
                </Button>
              </DialogTrigger>
              <DialogContent closeLabel={tCommon("close")}>
                <DialogHeader>
                  <DialogTitle>{t("settings")}</DialogTitle>
                  <DialogDescription>{t("keyboardHint")}</DialogDescription>
                </DialogHeader>

                <div className="space-y-7 py-2">
                  <div>
                    <p
                      id="theme-label"
                      className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                    >
                      {t("theme")}
                    </p>
                    <div
                      role="radiogroup"
                      aria-labelledby="theme-label"
                      className="grid grid-cols-3 gap-2.5"
                    >
                      {(["light", "sepia", "dark"] as ReaderTheme[]).map((option) => {
                        const colors = READER_THEMES[option];
                        const active = theme === option;
                        const labels: Record<ReaderTheme, string> = {
                          light: t("themeLight"),
                          sepia: t("themeSepia"),
                          dark: t("themeDark"),
                        };
                        return (
                          <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setTheme(option)}
                            className={`relative overflow-hidden rounded-xl border-2 p-2 text-left transition-colors ${
                              active ? "border-gold-500" : "border-border hover:border-gold-300"
                            }`}
                          >
                            <span
                              className="flex h-12 items-end rounded-md p-2"
                              style={{ background: colors.paper, color: colors.ink }}
                            >
                              <span className="font-serif text-lg leading-none">Aa</span>
                            </span>
                            <span className="mt-2 flex items-center justify-between text-[0.64rem] font-semibold">
                              {labels[option]}
                              {active && (
                                <Check className="size-3 text-gold-600" aria-hidden="true" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p
                      id="font-label"
                      className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                    >
                      {t("fontSize")}
                    </p>
                    <div
                      className="flex items-center justify-between rounded-xl border border-border p-2"
                      role="group"
                      aria-labelledby="font-label"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={decreaseFontSize}
                        disabled={fontSize <= MIN_FONT_SIZE}
                        aria-label={t("decreaseFont")}
                      >
                        <span className="text-base font-semibold">A−</span>
                      </Button>
                      <span className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
                        <Type className="size-3.5" aria-hidden="true" />
                        {fontSize}px
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={increaseFontSize}
                        disabled={fontSize >= MAX_FONT_SIZE}
                        aria-label={t("increaseFont")}
                      >
                        <span className="text-lg font-semibold">A+</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? t("exitFullscreen") : t("fullscreen")}
            className="hidden text-foreground hover:bg-black/5 sm:inline-flex"
          >
            {isFullscreen ? (
              <Minimize2 className="size-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        {format === "epub" ? (
          <EpubReader
            bookId={book.id}
            url={fileUrl}
            theme={theme}
            fontSize={fontSize}
            onProgress={handleProgress}
          />
        ) : (
          <PdfReader bookId={book.id} url={fileUrl} onProgress={handleProgress} />
        )}
      </div>
    </main>
  );
}
