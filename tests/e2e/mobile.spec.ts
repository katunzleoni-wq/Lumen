import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("opens the mobile navigation and reaches the catalogue", async ({ page }) => {
  await page.goto("/pt");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await sheet.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await expect(page).toHaveURL(/\/pt\/biblioteca$/);
  await expect(page.getByTestId("book-card").first()).toBeVisible();
});

test("keeps the reader usable on a narrow viewport", async ({ page }) => {
  await page.goto("/pt/ler/o-livro-dos-espiritos");
  await expect(page.getByTestId("reader-shell")).toBeVisible();
  await expect(page.locator("iframe")).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Ajustes de leitura" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
