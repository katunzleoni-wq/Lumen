import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  inverted?: boolean;
  compact?: boolean;
}

export function Logo({ className, inverted = false, compact = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "relative grid size-10 shrink-0 place-items-center rounded-full border",
          inverted
            ? "border-papyrus-100/20 bg-papyrus-50/5 text-papyrus-50"
            : "border-forest-900/10 bg-forest-950 text-papyrus-50 shadow-soft",
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 36 36" fill="none" className="size-6">
          <path
            d="M6 9.5c4.9-2.7 9.8-1.2 12 2 2.2-3.2 7.1-4.7 12-2V27c-4.9-2.2-9.8-.8-12 2.4C15.8 26.2 10.9 24.8 6 27V9.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M18 11.5v18" stroke="currentColor" strokeWidth="1.2" opacity=".7" />
          <circle cx="18" cy="4.5" r="1.5" className="fill-gold-300" />
          <path d="M13 15.5h2.5M20.5 15.5H23" stroke="currentColor" strokeWidth="1" opacity=".45" />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col">
          <span
            className={cn(
              "font-serif text-[1.45rem] leading-none tracking-[-0.02em]",
              inverted ? "text-papyrus-50" : "text-foreground",
            )}
          >
            Lumen
          </span>
          <span
            className={cn(
              "mt-1 hidden text-[0.55rem] font-semibold uppercase leading-none tracking-[0.2em] sm:block",
              inverted ? "text-papyrus-200/55" : "text-muted-foreground",
            )}
          >
            Biblioteca espírita
          </span>
        </span>
      )}
    </span>
  );
}
