import { expect, test } from "@playwright/test";

test("saves a work to the local shelf and removes it", async ({ page }) => {
  await page.goto("/pt/livro/o-livro-dos-espiritos");
  await page.getByRole("button", { name: "Salvar na minha estante" }).click();
  await expect(page.getByRole("button", { name: "Na sua estante" })).toBeVisible();

  await page.goto("/pt/favoritos");
  await expect(page.getByTestId("book-card")).toHaveCount(1);
  await expect(page.getByTestId("book-card")).toContainText("O Livro dos Espíritos");

  await page.reload();
  await expect(page.getByTestId("book-card")).toHaveCount(1);

  await page.getByRole("button", { name: /Remover O Livro dos Espíritos dos favoritos/ }).click();
  await expect(page.getByRole("heading", { name: "Sua estante está vazia" })).toBeVisible();
});
