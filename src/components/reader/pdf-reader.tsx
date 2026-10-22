"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { Document, Page, pdfjs } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { getReadingProgress, saveReadingProgress } from "@/lib/db";
import { clamp } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReaderLoading } from "./reader-loading";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfReaderProps {
  bookId: string;
  url: string;
  onProgress: (percent: number) => void;
}

export default function PdfReader({ bookId, url, onProgress }: PdfReaderProps) {
  const t = useTranslations("reader");
  const containerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const lastReading = useRef({ page: 1, numPages: 0 });
  const options = useMemo(() => ({ standardFontDataUrl: "/pdfjs/standard_fonts/" }), []);

  useEffect(() => {
    let active = true;
    getReadingProgress(bookId, "pdf")
      .then((progress) => {
        if (!active) return;
        if (progress?.page) setPage(progress.page);
        onProgress(progress?.percent ?? 0);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [bookId, onProgress]);

  useEffect(() => {
    if (!ready) return;
    const node = containerRef.current;
    if (!node) return;
    setContainerWidth(node.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ready]);

  useEffect(() => {
    if (!numPages || !ready) return;
    const percent = Math.round((page / numPages) * 100);
    lastReading.current = { page, numPages };
    onProgress(percent);
    const timer = setTimeout(() => {
      void saveReadingProgress({
        bookId,
        format: "pdf",
        location: null,
        page,
        totalPages: numPages,
        percent,
      });
    }, 450);
    return () => clearTimeout(timer);
  }, [bookId, numPages, onProgress, page, ready]);

  useEffect(() => {
    function flush() {
      const current = lastReading.current;
      if (!current.numPages) return;
      void saveReadingProgress({
        bookId,
        format: "pdf",
        location: null,
        page: current.page,
        totalPages: current.numPages,
        percent: Math.round((current.page / current.numPages) * 100),
      });
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") flush();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      flush();
    };
  }, [bookId]);

  const goToPage = useCallback(
    (next: number) => {
      if (!numPages) return;
      setPage(clamp(next, 1, numPages));
    },
    [numPages],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
      if (event.key === "ArrowRight") goToPage(page + 1);
      if (event.key === "ArrowLeft") goToPage(page - 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToPage, page]);

  const baseWidth = clamp(containerWidth - 32, 280, 780);
  const renderWidth = Math.round(baseWidth * zoom);

  if (!ready) return <ReaderLoading />;

  return (
    <div className="flex h-full flex-col bg-[#e9e5da]">
      <div ref={containerRef} className="reader-shell min-h-0 flex-1 overflow-auto px-4 py-6">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="font-serif text-xl">{t("error")}</p>
            <p className="max-w-sm text-xs text-muted-foreground">{t("errorBody")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(false);
                setRenderKey((key) => key + 1);
              }}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {t("retry")}
            </Button>
          </div>
        ) : (
          <Document
            key={renderKey}
            file={url}
            options={options}
            onLoadSuccess={(document: PDFDocumentProxy) => {
              setNumPages(document.numPages);
              setPage((current) => clamp(current, 1, document.numPages));
            }}
            onLoadError={() => setError(true)}
            loading={<ReaderLoading />}
            error={null}
            className="flex justify-center"
          >
            <Page
              pageNumber={page}
              width={renderWidth}
              devicePixelRatio={typeof window === "undefined" ? 1 : window.devicePixelRatio}
              loading={
                <div className="w-full max-w-[780px]">
                  <Skeleton className="aspect-[1/1.414] w-full bg-white/60" />
                </div>
              }
              className="overflow-hidden rounded-sm bg-white shadow-lift"
            />
          </Document>
        )}
      </div>

      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-t border-black/10 bg-[#f4f0e6]/95 px-3 backdrop-blur-sm sm:px-5">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            aria-label={t("previous")}
            className="text-foreground hover:bg-black/5"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => goToPage(page + 1)}
            disabled={page >= numPages}
            aria-label={t("next")}
            className="text-foreground hover:bg-black/5"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <p className="text-[0.68rem] font-medium tabular-nums text-muted-foreground">
          {t("page", { current: page, total: numPages || "—" })}
        </p>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              setZoom((current) => clamp(Number((current - 0.1).toFixed(1)), 0.7, 1.8))
            }
            disabled={zoom <= 0.7}
            aria-label={t("zoomOut")}
            className="text-foreground hover:bg-black/5"
          >
            <ZoomOut className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              setZoom((current) => clamp(Number((current + 0.1).toFixed(1)), 0.7, 1.8))
            }
            disabled={zoom >= 1.8}
            aria-label={t("zoomIn")}
            className="text-foreground hover:bg-black/5"
          >
            <ZoomIn className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <p className="sr-only">{t("pdfHint")}</p>
    </div>
  );
}
