"use client";

import { Check, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { books } from "@/content/books";
import { isLocale, localeLabels, locales } from "@/i18n";
import { usePathname } from "@/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LocaleSwitcherProps {
  inverted?: boolean;
  className?: string;
}

export function LocaleSwitcher({ inverted = false, className }: LocaleSwitcherProps) {
  const t = useTranslations("common");
  const currentLocale = useLocale();
  const pathname = usePathname();
  const activeLocale = isLocale(currentLocale) ? currentLocale : "pt";

  function localizedHref(option: (typeof locales)[number]) {
    const base = `/${option}${pathname && pathname !== "/" ? pathname : ""}`;
    const match = pathname?.match(/^\/(livro|ler)\/([^/?#]+)/);
    if (!match) return base;

    const [, section, slug] = match;
    const current = books.find((book) => book.slug === slug);
    if (!current) return base;

    const sibling = books.find(
      (book) =>
        book.language === option &&
        book.author === current.author &&
        book.originalTitle.trim().toLocaleLowerCase() ===
          current.originalTitle.trim().toLocaleLowerCase(),
    );
    return `/${option}/${section}/${sibling?.slug ?? current.slug}`;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          inverted
            ? "border-papyrus-50/20 text-papyrus-50 hover:bg-papyrus-50/10"
            : "border-border/80 bg-background/60 text-foreground hover:border-forest-300 hover:bg-secondary",
          className,
        )}
        aria-label={t("language")}
      >
        <Globe className="size-3.5 text-gold-600" aria-hidden="true" />
        {activeLocale.toUpperCase()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locales.map((option) => (
          <DropdownMenuItem key={option} asChild>
            <a
              href={localizedHref(option)}
              hrefLang={option}
              className="flex w-full items-center justify-between"
            >
              <span>{localeLabels[option]}</span>
              {option === activeLocale ? (
                <Check className="size-4 text-gold-600" aria-hidden="true" />
              ) : (
                <span className="text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
                  {option}
                </span>
              )}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
