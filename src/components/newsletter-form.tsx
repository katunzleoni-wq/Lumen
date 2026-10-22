"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { newsletterSchema, type NewsletterInput } from "@/lib/schemas";
import { saveNewsletterEmail } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterForm() {
  const t = useTranslations("home");
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterInput>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "", company: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(false);
    try {
      await saveNewsletterEmail(values.email);
      reset({ email: "", company: "" });
      setDone(true);
    } catch {
      setServerError(true);
    }
  });

  if (done) {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-forest-200 bg-forest-50/80 p-4 text-sm text-forest-800"
      >
        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-forest-700 text-white">
          <Check className="size-3.5" aria-hidden="true" />
        </span>
        <p>{t("newsletterSuccess")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          {...register("company")}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
        />
        <div className="flex-1">
          <label htmlFor="newsletter-email" className="sr-only">
            {t("newsletterPlaceholder")}
          </label>
          <Input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            placeholder={t("newsletterPlaceholder")}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "newsletter-error" : "newsletter-privacy"}
            {...register("email")}
          />
        </div>
        <Button type="submit" variant="gold" disabled={isSubmitting} className="shrink-0">
          {t("newsletterCta")}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
      {errors.email && (
        <p id="newsletter-error" role="alert" className="text-xs font-medium text-destructive">
          {t("newsletterInvalid")}
        </p>
      )}
      {serverError && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {t("newsletterInvalid")}
        </p>
      )}
      <p id="newsletter-privacy" className="text-[0.68rem] leading-relaxed text-muted-foreground">
        {t("newsletterPrivacy")}
      </p>
    </form>
  );
}
