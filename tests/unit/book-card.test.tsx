import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { BookCard } from "@/components/books/book-card";
import { books } from "@/content/books";
import pt from "@/messages/pt.json";

vi.mock("next/navigation", () => ({
  usePathname: () => "/biblioteca",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill: _fill, priority: _priority, unoptimized: _unoptimized, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)} alt={String(rest.alt)} />;
  },
}));

vi.mock("@/components/site/favorite-button", () => ({
  FavoriteButton: () => <button type="button">Salvar</button>,
}));

function renderCard() {
  const book = books[0]!;
  render(
    <NextIntlClientProvider locale="pt" messages={pt}>
      <BookCard book={book} locale="pt" />
    </NextIntlClientProvider>,
  );
  return book;
}

describe("BookCard", () => {
  it("renders localized metadata and links to the edition", () => {
    const book = renderCard();
    expect(screen.getByRole("heading", { name: book.title.pt })).toBeInTheDocument();
    expect(screen.getAllByText(book.author).length).toBeGreaterThan(0);
    expect(screen.getByText(`${book.readingMinutes} min de leitura`)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: book.title.pt })).toHaveAttribute(
      "href",
      `/pt/livro/${book.slug}`,
    );
  });

  it("shows format badges and the favourite control", () => {
    const book = renderCard();
    for (const format of book.formats) {
      expect(screen.getByText(format.toUpperCase())).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });
});
