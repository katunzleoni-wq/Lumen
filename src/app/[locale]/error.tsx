"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main-content"
      className="container flex min-h-dvh flex-col items-center justify-center py-24 text-center"
    >
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-gold-700">500</p>
      <h1 className="mt-4 font-serif text-4xl font-medium tracking-[-0.03em]">{t("error")}</h1>
      <Button onClick={reset} className="mt-8">
        <RotateCcw className="size-4" aria-hidden="true" />
        {t("retry")}
      </Button>
    </main>
  );
}
