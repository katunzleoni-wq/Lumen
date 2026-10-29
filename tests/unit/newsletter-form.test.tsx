import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewsletterForm } from "@/components/newsletter-form";
import pt from "@/messages/pt.json";

const { saveNewsletterEmail } = vi.hoisted(() => ({
  saveNewsletterEmail: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  saveNewsletterEmail,
}));

function renderForm() {
  render(
    <NextIntlClientProvider locale="pt" messages={pt}>
      <NewsletterForm />
    </NextIntlClientProvider>,
  );
}

describe("NewsletterForm", () => {
  beforeEach(() => {
    saveNewsletterEmail.mockClear();
  });

  it("shows a localized validation error for invalid email", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText("Seu melhor e-mail"), "invalido");
    await user.click(screen.getByRole("button", { name: /Salvar neste navegador/ }));
    expect(await screen.findByText("Informe um endereço de e-mail válido.")).toBeInTheDocument();
    expect(saveNewsletterEmail).not.toHaveBeenCalled();
  });

  it("persists locally and confirms success", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText("Seu melhor e-mail"), "leitora@lumen.test");
    await user.click(screen.getByRole("button", { name: /Salvar neste navegador/ }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "E-mail salvo apenas neste navegador",
    );
    expect(saveNewsletterEmail).toHaveBeenCalledWith("leitora@lumen.test");
  });
});
