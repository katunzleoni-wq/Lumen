"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ListTree, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactReader, ReactReaderStyle, type IReactReaderStyle } from "react-reader";
import type { NavItem, Rendition } from "epubjs";
import { getReadingProgress, saveReadingProgress } from "@/lib/db";
import { READER_THEMES, type ReaderTheme } from "@/stores/reader-store";
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

interface EpubReaderProps {
  bookId: string;
  url: string;
  theme: ReaderTheme;
  fontSize: number;
  onProgress: (percent: number) => void;
}

const readerStyles: IReactReaderStyle = {
  ...ReactReaderStyle,
  container: { ...ReactReaderStyle.container, height: "100%", background: "transparent" },
  readerArea: {
    ...ReactReaderStyle.readerArea,
    background: "transparent",
    transition: "background-color 220ms ease",
  },
  titleArea: { ...ReactReaderStyle.titleArea, display: "none" },
  reader: {
    position: "absolute",
    inset: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: "0 8px",
  },
  arrow: { ...ReactReaderStyle.arrow, display: "none" },
  tocButton: { ...ReactReaderStyle.tocButton, display: "none" },
};

function applyTheme(rendition: Rendition, theme: ReaderTheme, fontSize: number) {
  const colors = READER_THEMES[theme];
  rendition.themes.default({
    html: {
      background: `${colors.paper} !important`,
      "color-scheme": theme === "dark" ? "dark" : "light",
    },
    body: {
      background: `${colors.paper} !important`,
      color: `${colors.ink} !important`,
      "font-family": "Georgia, 'Times New Roman', serif !important",
      "line-height": "1.75 !important",
      padding: "0 6% !important",
    },
    "p, li, blockquote, dd": {
      color: `${colors.ink} !important`,
      "line-height": "1.78 !important",
      "text-align": "justify",
      hyphens: "auto",
    },
    "h1, h2, h3, h4": {
      color: `${colors.ink} !important`,
      "font-family": "Georgia, 'Times New Roman', serif !important",
      "line-height": "1.25 !important",
      "text-align": "left",
    },
    a: { color: `${colors.accent} !important` },
    "::selection": { background: "rgba(197, 156, 78, 0.35) !important" },
  });
  rendition.themes.fontSize(`${fontSize}px`);
}

export default function EpubReader({ bookId, url, theme, fontSize, onProgress }: EpubReaderProps) {
  const t = useTranslations("reader");
  const tCommon = useTranslations("common");
  const [location, setLocation] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [percent, setPercent] = useState(0);
  const [toc, setToc] = useState<NavItem[]>([]);
  const [tocOpen, setTocOpen] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const renditionRef = useRef<Rendition | null>(null);
  const locationRef = useRef<string | null>(null);
  const locationsReady = useRef(false);
  const percentRef = useRef(0);
  const themeRef = useRef(theme);
  const fontRef = useRef(fontSize);
  const onProgressRef = useRef(onProgress);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    themeRef.current = theme;
    fontRef.current = fontSize;
    if (renditionRef.current) applyTheme(renditionRef.current, theme, fontSize);
  }, [theme, fontSize]);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    let active = true;
    getReadingProgress(bookId, "epub")
      .then((progress) => {
        if (!active) return;
        if (progress) {
          setLocation(progress.location);
          locationRef.current = progress.location;
          setPercent(progress.percent);
          percentRef.current = progress.percent;
          onProgressRef.current(progress.percent);
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [bookId]);

  const flushProgress = useCallback(() => {
    const currentLocation = locationRef.current;
    if (!currentLocation) return;
    void saveReadingProgress({
      bookId,
      format: "epub",
      location: currentLocation,
      page: 0,
      totalPages: 0,
      percent: percentRef.current,
    });
  }, [bookId]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") flushProgress();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      flushProgress();
    };
  }, [flushProgress]);

  const scheduleSave = useCallback(
    (nextLocation: string, nextPercent: number) => {
      onProgressRef.current(nextPercent);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void saveReadingProgress({
          bookId,
          format: "epub",
          location: nextLocation,
          page: 0,
          totalPages: 0,
          percent: nextPercent,
        });
      }, 600);
    },
    [bookId],
  );

  const handleLocationChanged = useCallback((nextLocation: string) => {
    locationRef.current = nextLocation;
    setLocation(nextLocation);
  }, []);

  const handleRendition = useCallback(
    (rendition: Rendition) => {
      renditionRef.current = rendition;
      applyTheme(rendition, themeRef.current, fontRef.current);

      rendition.book.ready
        .then(() => rendition.book.locations.generate(1400))
        .then(() => {
          locationsReady.current = true;
          const cfi = locationRef.current;
          if (!cfi) return;
          const nextPercent = Math.round(rendition.book.locations.percentageFromCfi(cfi) * 100);
          percentRef.current = nextPercent;
          setPercent(nextPercent);
          scheduleSave(cfi, nextPercent);
        })
        .catch(() => {
          // Location generation can be unavailable for unusual EPUB packages.
        });

      rendition.on("relocated", (nextLocation: { start: { percentage?: number; cfi: string } }) => {
        const cfi = nextLocation.start.cfi;
        const nextPercent = locationsReady.current
          ? Math.round(rendition.book.locations.percentageFromCfi(cfi) * 100)
          : Math.round((nextLocation.start.percentage ?? 0) * 100);
        percentRef.current = nextPercent;
        setPercent(nextPercent);
        scheduleSave(cfi, nextPercent);
      });
    },
    [scheduleSave],
  );

  function goTo(href: string) {
    renditionRef.current?.display(href);
    setTocOpen(false);
  }

  return (
    <div
      className="reader-shell flex h-full flex-col"
      style={{ background: READER_THEMES[theme].paper }}
    >
      <div className="relative min-h-0 flex-1">
        {!ready ? (
          <ReaderLoading />
        ) : (
          <ReactReader
            key={renderKey}
            url={url}
            title={undefined}
            showToc={false}
            location={location}
            locationChanged={handleLocationChanged}
            tocChanged={setToc}
            getRendition={handleRendition}
            epubInitOptions={{ openAs: "epub" }}
            epubOptions={{
              flow: "paginated",
              manager: "default",
              spread: "auto",
              allowScriptedContent: true,
            }}
            readerStyles={readerStyles}
            loadingView={<ReaderLoading />}
            errorView={
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="font-serif text-xl">{t("error")}</p>
                <p className="max-w-sm text-xs text-muted-foreground">{t("errorBody")}</p>
                <Button variant="outline" size="sm" onClick={() => setRenderKey((key) => key + 1)}>
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  {t("retry")}
                </Button>
              </div>
            }
          />
        )}
      </div>

      <div
        className="relative z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-t border-black/10 px-3 backdrop-blur-sm sm:px-5"
        style={{ background: READER_THEMES[theme].chrome }}
      >
        <div className="flex min-w-[5.5rem] items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => renditionRef.current?.prev()}
            aria-label={t("previous")}
            className="text-foreground hover:bg-black/5"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => renditionRef.current?.next()}
            aria-label={t("next")}
            className="text-foreground hover:bg-black/5"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="h-1 w-24 overflow-hidden rounded-full bg-black/10 sm:w-36"
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-gold-500 transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-[0.65rem] font-medium tabular-nums text-muted-foreground">
            {t("progress", { percent })}
          </span>
        </div>

        <div className="flex min-w-[5.5rem] items-center justify-end gap-1">
          <Dialog open={tocOpen} onOpenChange={setTocOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("openToc")}
                className="text-foreground hover:bg-black/5"
              >
                <ListTree className="size-4" aria-hidden="true" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80dvh] overflow-hidden" closeLabel={tCommon("close")}>
              <DialogHeader>
                <DialogTitle>{t("toc")}</DialogTitle>
                <DialogDescription>{t("epubHint")}</DialogDescription>
              </DialogHeader>
              <div className="max-h-[55dvh] overflow-y-auto pr-1">
                {toc.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">{t("loading")}</p>
                ) : (
                  <ol className="divide-y divide-border/60">
                    {toc.map((item) => (
                      <li key={`${item.href}-${item.label}`}>
                        <button
                          type="button"
                          onClick={() => goTo(item.href)}
                          className="flex w-full items-baseline gap-3 py-3 text-left text-sm transition-colors hover:text-primary"
                        >
                          <span
                            className="size-1 shrink-0 rounded-full bg-gold-500"
                            aria-hidden="true"
                          />
                          <span>{item.label.trim()}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <p className="sr-only">{t("keyboardHint")}</p>
    </div>
  );
}
