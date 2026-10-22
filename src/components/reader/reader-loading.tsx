"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function ReaderLoading({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("reader");

  return (
    <div
      className={
        compact
          ? "flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground"
          : "flex h-full min-h-48 flex-col items-center justify-center gap-3 text-muted-foreground"
      }
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-5 animate-spin text-gold-600" aria-hidden="true" />
      <p className="text-sm">{t("loading")}</p>
    </div>
  );
}
