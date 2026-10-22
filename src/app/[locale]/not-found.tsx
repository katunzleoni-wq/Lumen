import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { Button } from "@/components/ui/button";

export default function LocalizedNotFound() {
  const t = useTranslations("notFound");

  return (
    <main
      id="main-content"
      className="container flex min-h-dvh flex-col items-center justify-center py-24 text-center"
    >
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-gold-700">
        {t("eyebrow")}
      </p>
      <h1 className="mt-4 max-w-2xl text-balance font-serif text-4xl font-medium tracking-[-0.03em] sm:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-5 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
        {t("description")}
      </p>
      <Button asChild className="mt-8">
        <Link href="/">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t("cta")}
        </Link>
      </Button>
    </main>
  );
}
