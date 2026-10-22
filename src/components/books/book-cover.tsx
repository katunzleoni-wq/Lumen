import Image from "next/image";
import { getBookCover } from "@/content/books";
import { cn } from "@/lib/utils";

interface BookCoverProps {
  slug: string;
  title: string;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

export function BookCover({
  slug,
  title,
  alt,
  priority = false,
  className,
  sizes = "(max-width: 768px) 50vw, 25vw",
}: BookCoverProps) {
  return (
    <div
      className={cn(
        "relative aspect-[2/3] overflow-hidden rounded-l-[3px] rounded-r-lg bg-forest-900 shadow-book",
        className,
      )}
      data-book-cover={slug}
    >
      <Image
        src={getBookCover(slug)}
        alt={alt}
        fill
        priority={priority}
        unoptimized
        sizes={sizes}
        className="object-cover"
        title={title}
      />
      <span
        className="pointer-events-none absolute inset-y-0 left-0 w-[9%] bg-gradient-to-r from-black/45 via-white/10 to-transparent"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10"
        aria-hidden="true"
      />
    </div>
  );
}
