import { expect, test } from "@playwright/test";

test("scopes the library to the interface language and keeps covers aligned", async ({ page }) => {
  await page.goto("/pt/biblioteca");
  await expect(page.getByTestId("book-card")).toHaveCount(8);
  await expect(page.getByText("Exibindo edições em Português.")).toBeVisible();
  await expect(page.locator('img[src="/covers/apres-la-mort.svg"]')).toHaveCount(0);

  await page.goto("/en/biblioteca");
  await expect(page.getByTestId("book-card")).toHaveCount(3);
  await expect(page.getByText("Showing editions in English.")).toBeVisible();
  await expect(page.getByTestId("book-card").first()).toContainText("Mysterious Psychic Forces");
  await expect(page.locator('img[src="/covers/o-livro-dos-espiritos.svg"]')).toHaveCount(0);
});

test("switches to the sibling edition when changing the interface language", async ({ page }) => {
  await page.goto("/pt/livro/depois-da-morte");
  await page.getByRole("button", { name: "Idioma" }).click();
  await page.getByRole("menuitem").filter({ hasText: "Français" }).click();
  await expect(page).toHaveURL(/\/fr\/livro\/apres-la-mort$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Après la mort");
});

test("switches editions inside the reader", async ({ page }) => {
  await page.goto("/pt/ler/depois-da-morte");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Depois da Morte");
  await page.getByRole("link", { name: "FR" }).click();
  await expect(page).toHaveURL(/\/pt\/ler\/apres-la-mort$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Après la mort");
});

test("marks a foreign-language edition and offers sibling editions", async ({ page }) => {
  await page.goto("/en/livro/depois-da-morte");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Depois da Morte");
  await expect(page.getByText(/This edition's language is Português/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Français" })).toHaveAttribute(
    "href",
    "/en/livro/apres-la-mort",
  );
  await expect(page.getByRole("link", { name: "Português" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
