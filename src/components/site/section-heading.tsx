import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <p className="mb-3 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-gold-700">
            <span className="h-px w-6 bg-gold-500" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h2 className="text-balance font-serif text-3xl font-medium leading-[1.14] tracking-[-0.02em] text-foreground sm:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-4 max-w-xl text-pretty text-[0.95rem] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
