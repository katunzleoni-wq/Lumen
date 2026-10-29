import { expect, test } from "@playwright/test";

test("redirects the root to the detected locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/pt$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Leia com tempo");
});

test("switches language without losing the current page", async ({ page }) => {
  await page.goto("/pt/biblioteca");
  await page.getByRole("button", { name: "Idioma" }).click();
  await page.getByRole("menuitem").filter({ hasText: "English" }).click();
  await expect(page).toHaveURL(/\/en\/biblioteca$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "The whole library, in one place",
  );
});

test("exposes every localized edition from the home page", async ({ page }) => {
  await page.goto("/es");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Lee con tiempo");
  await page.getByRole("link", { name: "Explorar el acervo" }).first().click();
  await expect(page).toHaveURL(/\/es\/biblioteca$/);
  await expect(page.getByTestId("book-card")).toHaveCount(11);
});

test("keeps key pages free of horizontal overflow", async ({ page }) => {
  for (const path of ["/pt", "/pt/biblioteca", "/pt/sobre", "/pt/livro/o-livro-dos-espiritos"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
  }
});
