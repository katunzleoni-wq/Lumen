import { expect, test } from "@playwright/test";

test("searches the indexed multilingual content with Pagefind", async ({ page }) => {
  await page.goto("/pt/busca");
  await page.getByRole("searchbox").fill("caridade");
  await expect(page.getByText("Resultados para “caridade”")).toBeVisible();
  await expect(page.locator("ol > li").first()).toContainText("caridade");
  await expect(page.locator("ol > li")).not.toHaveCount(0);

  await page
    .getByRole("link", { name: /O Evangelho segundo o Espiritismo/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/pt\/livro\/o-evangelho-segundo-o-espiritismo$/);
});

test("filters search results by resource type", async ({ page }) => {
  await page.goto("/pt/busca?q=espírito");
  await expect(page.locator("ol > li").first()).toBeVisible();
  await page.getByRole("tab", { name: "Obras" }).click();
  await expect(page.locator("ol > li").first()).toContainText("Obras");
  await expect(page.locator("ol > li").first().getByText("Páginas")).toHaveCount(0);
});

test("serves the English search index on the /en route", async ({ page }) => {
  await page.goto("/en/busca");
  await page.getByRole("searchbox").fill("charity");
  await expect(page.getByText("Results for “charity”")).toBeVisible();
  await expect(page.locator("ol > li").first()).toContainText("charity");
});
