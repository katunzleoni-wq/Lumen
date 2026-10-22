"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useFavorite } from "@/lib/use-library";
import { toggleFavorite } from "@/lib/db";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  bookId: string;
  title: string;
  variant?: "icon" | "full";
  className?: string;
}

export function FavoriteButton({
  bookId,
  title,
  variant = "icon",
  className,
}: FavoriteButtonProps) {
  const t = useTranslations();
  const favorite = useFavorite(bookId);
  const [pending, setPending] = useState(false);
  const isFavorite = Boolean(favorite);

  async function handleToggle() {
    setPending(true);
    try {
      const added = await toggleFavorite(bookId);
      toast.success(added ? t("common.favoriteAdded") : t("common.favoriteRemoved"), {
        description: title,
      });
    } catch {
      toast.error(t("common.error"));
    } finally {
      setPending(false);
    }
  }

  const label = isFavorite ? t("a11y.favoriteRemove", { title }) : t("a11y.favoriteAdd", { title });

  if (variant === "full") {
    return (
      <Button
        type="button"
        variant={isFavorite ? "secondary" : "outline"}
        onClick={handleToggle}
        disabled={pending}
        aria-pressed={isFavorite}
        className={cn("min-w-12", className)}
      >
        <Bookmark
          className={cn("size-4", isFavorite && "fill-gold-500 text-gold-600")}
          aria-hidden="true"
        />
        {isFavorite ? t("book.saved") : t("book.favorite")}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={handleToggle}
      disabled={pending}
      aria-pressed={isFavorite}
      aria-label={label}
      className={cn(
        "rounded-full border-white/35 bg-forest-950/35 text-papyrus-50 shadow-soft backdrop-blur-md hover:border-white/60 hover:bg-forest-950/55 hover:text-papyrus-50",
        isFavorite && "border-gold-300/60 bg-gold-400/20 text-gold-100",
        className,
      )}
    >
      <Bookmark
        className={cn("size-4 transition-transform", isFavorite && "fill-current")}
        aria-hidden="true"
      />
    </Button>
  );
}
