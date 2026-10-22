"use client";

import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  title: string;
}

export function ShareButton({ title }: ShareButtonProps) {
  const t = useTranslations();

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success(t("common.copied"));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(t("common.error"));
    }
  }

  return (
    <Button type="button" variant="ghost" onClick={handleShare} className="px-4">
      <Share2 className="size-4" aria-hidden="true" />
      <span className="hidden sm:inline">{t("book.share")}</span>
      <span className="sr-only sm:hidden">{t("book.share")}</span>
    </Button>
  );
}
