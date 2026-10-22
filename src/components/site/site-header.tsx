"use client";

import { useEffect, useState } from "react";
import { Bookmark, Menu, Search, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { isLocale, localeLabels, locales } from "@/i18n";
import { Link, usePathname, useRouter } from "@/navigation";
import { cn } from "@/lib/utils";
import { useFavoriteCount } from "@/lib/use-library";
import { Logo } from "./logo";
import { LocaleSwitcher } from "./locale-switcher";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/biblioteca", key: "library" },
  { href: "/sobre", key: "about" },
] as const;

export function SiteHeader() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const favoriteCount = useFavoriteCount();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeLocale = isLocale(locale) ? locale : "pt";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if (isTyping) return;
      if (
        (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) ||
        ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k")
      ) {
        event.preventDefault();
        router.push("/busca");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container flex h-[4.5rem] items-center justify-between gap-4">
        <Link
          href="/"
          aria-label={t("meta.siteName")}
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
        >
          <Logo />
        </Link>

        <nav aria-label={t("nav.main")} className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm font-medium transition-colors hover:text-foreground",
                isActive(item.href) ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {t(`nav.${item.key}`)}
              {isActive(item.href) && (
                <span
                  className="absolute inset-x-4 -bottom-0.5 h-px bg-gold-500"
                  aria-hidden="true"
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href="/busca"
            className="group hidden h-10 items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-forest-300 hover:text-foreground lg:inline-flex"
            aria-label={t("common.search")}
          >
            <Search className="size-3.5 text-gold-600" aria-hidden="true" />
            <span>{t("common.search")}</span>
            <kbd className="ml-1 hidden rounded border border-border bg-papyrus-100 px-1.5 py-0.5 font-sans text-[0.58rem] font-semibold text-muted-foreground xl:inline">
              /
            </kbd>
          </Link>

          <Link
            href="/busca"
            aria-label={t("common.search")}
            className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <Search className="size-[1.15rem]" aria-hidden="true" />
          </Link>

          <Link
            href="/favoritos"
            aria-label={t("common.favorites")}
            className="relative inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Bookmark className="size-[1.15rem]" aria-hidden="true" />
            {favoriteCount > 0 && (
              <span
                className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-gold-400 px-1 text-[0.55rem] font-bold leading-4 text-forest-950"
                aria-hidden="true"
              >
                {favoriteCount > 9 ? "9+" : favoriteCount}
              </span>
            )}
            {favoriteCount > 0 && (
              <span className="sr-only">{t("favorites.count", { count: favoriteCount })}</span>
            )}
          </Link>

          <LocaleSwitcher className="hidden sm:inline-flex" />

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label={t("common.openMenu")}
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col bg-background" closeLabel={t("common.close")}>
              <SheetHeader className="pb-2">
                <SheetTitle className="sr-only">{t("nav.main")}</SheetTitle>
                <SheetDescription className="sr-only">{t("meta.homeDescription")}</SheetDescription>
                <Logo />
              </SheetHeader>
              <nav aria-label={t("nav.main")} className="flex flex-col gap-1 px-4 py-6">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 font-serif text-2xl text-foreground transition-colors hover:bg-secondary"
                >
                  {t("common.home")}
                </Link>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-4 py-3 font-serif text-2xl text-foreground transition-colors hover:bg-secondary"
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                ))}
                <Link
                  href="/busca"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 font-serif text-2xl text-foreground transition-colors hover:bg-secondary"
                >
                  <Search className="size-5 text-gold-600" aria-hidden="true" />
                  {t("nav.search")}
                </Link>
                <Link
                  href="/favoritos"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 font-serif text-2xl text-foreground transition-colors hover:bg-secondary"
                >
                  <Bookmark className="size-5 text-gold-600" aria-hidden="true" />
                  {t("nav.favorites")}
                </Link>
              </nav>
              <div className="mt-auto border-t border-border px-6 py-6">
                <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t("common.language")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {locales.map((item) => (
                    <a
                      key={item}
                      href={`/${item}${pathname && pathname !== "/" ? pathname : ""}`}
                      hrefLang={item}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl border px-3 py-2 text-sm",
                        item === activeLocale
                          ? "border-gold-300 bg-gold-50 text-gold-800"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {localeLabels[item]}
                      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.14em]">
                        {item}
                      </span>
                    </a>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="size-3.5 text-gold-500" aria-hidden="true" />
                  {t("hero.trust")}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
