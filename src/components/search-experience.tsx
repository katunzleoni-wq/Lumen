"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, BookOpen, FileText, Search, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import type { PagefindModule, PagefindResultData } from "@/types/pagefind";
import { categories, getCategoryName } from "@/content/books";
import type { Locale } from "@/i18n";
import { Link } from "@/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SearchType = "all" | "book" | "page";
type SearchState = "idle" | "loading" | "ready" | "error";

let pagefindPromise: Promise<PagefindModule> | null = null;

function loadPagefind() {
  if (!pagefindPromise) {
    const pagefindUrl = "/pagefind/pagefind.js";
    pagefindPromise = (import(/* webpackIgnore: true */ pagefindUrl) as Promise<PagefindModule>)
      .then(async (module) => {
        await module.options({ excerptLength: 28 });
        await module.init();
        return module;
      })
      .catch((error) => {
        pagefindPromise = null;
        throw error;
      });
  }
  return pagefindPromise;
}

function sanitizeExcerpt(html: string) {
  return html.replace(/<(?!\/?mark\b)[^>]*>/gi, "");
}

function stripLocale(url: string) {
  const stripped = url.replace(/^\/(pt|en|es|fr)(?=\/|$)/, "");
  return stripped || "/";
}

export function SearchExperience({ locale }: { locale: Locale }) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [type, setType] = useState<SearchType>("all");
  const [category, setCategory] = useState("all");
  const [results, setResults] = useState<PagefindResultData[]>([]);
  const [state, setState] = useState<SearchState>(initialQuery ? "loading" : "idle");
  const requestId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 240);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (query.trim()) url.searchParams.set("q", query.trim());
    else url.searchParams.delete("q");
    window.history.replaceState({}, "", url);
  }, [query]);

  const runSearch = useCallback(async () => {
    if (!debouncedQuery) {
      setResults([]);
      setState("idle");
      return;
    }
    const currentRequest = ++requestId.current;
    setState("loading");
    try {
      const pagefind = await loadPagefind();
      const filters: Record<string, string[]> = { locale: [locale] };
      if (type !== "all") filters.type = [type];
      if (category !== "all") filters.category = [category];

      const response = await pagefind.search(debouncedQuery, { filters });
      const data = await Promise.all(response.results.slice(0, 30).map((result) => result.data()));
      if (requestId.current !== currentRequest) return;
      setResults(data);
      setState("ready");
    } catch (error) {
      console.error("[pagefind] search failed", error);
      if (requestId.current === currentRequest) {
        setResults([]);
        setState("error");
      }
    }
  }, [category, debouncedQuery, locale, type]);

  useEffect(() => {
    void runSearch();
  }, [runSearch]);

  const suggestions = t("search.suggestionTerms")
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean);

  return (
    <div>
      <div className="rounded-[1.75rem] border border-border/80 bg-card/85 p-3 shadow-soft sm:p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-gold-600"
            aria-hidden="true"
          />
          <label htmlFor="global-search" className="sr-only">
            {t("search.placeholder")}
          </label>
          <Input
            ref={inputRef}
            id="global-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search.placeholder")}
            autoComplete="off"
            className="h-14 rounded-full border-transparent bg-background/60 pl-14 pr-12 text-base shadow-none focus-visible:border-forest-300 sm:h-16 sm:text-lg"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-4 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label={t("search.clear")}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2 px-1 pb-1 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={type} onValueChange={(value) => setType(value as SearchType)}>
            <TabsList aria-label={t("search.filterType")}>
              <TabsTrigger value="all">{t("search.allTypes")}</TabsTrigger>
              <TabsTrigger value="book">{t("search.books")}</TabsTrigger>
              <TabsTrigger value="page">{t("search.pages")}</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <label htmlFor="search-category" className="sr-only">
              {t("search.filterCategory")}
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="search-category" className="h-9 w-44 rounded-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("search.allCategories")}</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {getCategoryName(item.id, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-8" aria-live="polite">
        {state === "idle" && (
          <div className="rounded-[2rem] border border-border/70 bg-papyrus-50/40 px-6 py-14 text-center sm:py-20">
            <span className="mx-auto grid size-16 place-items-center rounded-full border border-gold-200 bg-gold-50 text-gold-700">
              <Sparkles className="size-6" strokeWidth={1.4} aria-hidden="true" />
            </span>
            <h2 className="mt-6 font-serif text-3xl font-medium tracking-[-0.02em]">
              {t("search.tryThese")}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t("search.hint")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setQuery(suggestion)}
                  className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-gold-300 hover:bg-gold-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {state === "loading" && (
          <div className="space-y-3" aria-busy="true" aria-label={t("search.loading")}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-border/70 bg-card/60 p-5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-3 h-5 w-2/3" />
                <Skeleton className="mt-3 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-4/5" />
              </div>
            ))}
          </div>
        )}

        {state === "error" && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
            <p className="font-serif text-xl">{t("search.error")}</p>
            {process.env.NODE_ENV === "development" && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {t("search.indexMissing")}
              </p>
            )}
            <Button variant="outline" size="sm" onClick={() => void runSearch()} className="mt-4">
              {t("common.retry")}
            </Button>
          </div>
        )}

        {state === "ready" && (
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="font-serif text-2xl font-medium tracking-[-0.02em]">
                  {t("search.resultsFor", { query: debouncedQuery })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("search.results", { count: results.length })}
                </p>
              </div>
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-gold-700">
                Pagefind
              </span>
            </div>

            {results.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
                <Search
                  className="mx-auto size-8 text-gold-600"
                  strokeWidth={1.3}
                  aria-hidden="true"
                />
                <h3 className="mt-4 font-serif text-2xl font-medium">{t("search.emptyTitle")}</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {t("search.emptyBody")}
                </p>
                <Button asChild variant="outline" className="mt-5">
                  <Link href="/biblioteca">{t("search.browse")}</Link>
                </Button>
              </div>
            ) : (
              <ol className="mt-6 space-y-3">
                {results.map((result) => {
                  const isBook = result.meta.type === "book";
                  return (
                    <li key={result.url}>
                      <Link
                        href={stripLocale(result.url)}
                        locale={locale}
                        className="group block rounded-2xl border border-border/70 bg-card/75 p-5 transition-all hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-soft sm:p-6"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={isBook ? "gold" : "outline"}
                            className="px-2.5 py-0.5 text-[0.56rem]"
                          >
                            {isBook ? (
                              <>
                                <BookOpen className="size-3" aria-hidden="true" />
                                {t("search.books")}
                              </>
                            ) : (
                              <>
                                <FileText className="size-3" aria-hidden="true" />
                                {t("search.pages")}
                              </>
                            )}
                          </Badge>
                          {result.meta.category && (
                            <span className="text-[0.62rem] text-muted-foreground">
                              {result.meta.category}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-serif text-xl font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                              {result.meta.title || result.url}
                            </h3>
                            {result.meta.author && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {result.meta.author}
                              </p>
                            )}
                          </div>
                          <ArrowUpRight
                            className="mt-1 size-4 shrink-0 text-gold-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </div>
                        <p
                          className="mt-2 text-sm leading-relaxed text-muted-foreground [&_mark]:rounded-sm [&_mark]:bg-gold-200/80 [&_mark]:px-0.5 [&_mark]:text-foreground"
                          dangerouslySetInnerHTML={{ __html: sanitizeExcerpt(result.excerpt) }}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
