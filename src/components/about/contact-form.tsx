"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { contactSchema, type ContactInput } from "@/lib/schemas";
import type { Locale } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm({ locale }: { locale: Locale }) {
  const t = useTranslations("about");
  const tCommon = useTranslations("common");
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "", locale, company: "" },
  });

  function fieldError(code: string | undefined) {
    if (!code) return null;
    if (code === "email_invalid" || code === "email_required") return t("contactEmailError");
    if (code === "message_short") return t("contactMessageError");
    return t("contactNameError");
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(false);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error(`contact request failed: ${response.status}`);
      reset({ name: "", email: "", message: "", locale, company: "" });
      setSubmitted(true);
    } catch {
      setServerError(true);
    }
  });

  if (submitted) {
    return (
      <div
        role="status"
        className="flex min-h-[20rem] flex-col items-center justify-center rounded-2xl border border-forest-200 bg-forest-50/70 p-8 text-center"
      >
        <span className="grid size-14 place-items-center rounded-full bg-forest-700 text-white">
          <Check className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-5 max-w-sm font-serif text-2xl leading-snug text-forest-900">
          {t("contactSuccess")}
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>
          {t("contactCta")}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <input
        {...register("company")}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">{t("contactName")}</Label>
          <Input
            id="contact-name"
            autoComplete="name"
            placeholder={t("contactName")}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            {...register("name")}
          />
          {errors.name && (
            <p
              id="contact-name-error"
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {fieldError(errors.name.message)}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">{t("contactEmail")}</Label>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p
              id="contact-email-error"
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {fieldError(errors.email.message)}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">{t("contactMessage")}</Label>
        <Textarea
          id="contact-message"
          placeholder={t("contactMessagePlaceholder")}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : "contact-message-hint"}
          {...register("message")}
        />
        <p
          id="contact-message-hint"
          className="text-pretty text-[0.66rem] leading-relaxed text-muted-foreground"
        >
          {t("privacyBody")}
        </p>
        {errors.message && (
          <p
            id="contact-message-error"
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {fieldError(errors.message.message)}
          </p>
        )}
      </div>
      {serverError && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs font-medium text-destructive"
        >
          {t("contactError")}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} size="lg">
        {isSubmitting ? tCommon("loading") : t("contactSubmit")}
        <Send className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
