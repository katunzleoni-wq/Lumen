import { expect, test } from "@playwright/test";

test("publishes the licences page and the FEB authorisation", async ({ page }) => {
  await page.goto("/pt/licencas");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Licenças e direitos");
  const pdf = page.getByRole("link", { name: /Abrir autorização FEB/ });
  await expect(pdf).toHaveAttribute("href", "/licenses/feb-2026-leon-denis.pdf");
  const response = await page.request.get("/licenses/feb-2026-leon-denis.pdf");
  expect(response.ok()).toBeTruthy();
});

test("does not promise offline reading or expose a dead contact form", async ({ page }) => {
  await page.goto("/pt");
  await expect(page.getByText(/leitura offline/i)).toHaveCount(0);

  await page.goto("/pt/sobre");
  await expect(page.getByText("Canal de contato em preparação")).toBeVisible();
  await expect(page.getByLabel("Nome")).toHaveCount(0);
  await expect(page.getByLabel("Mensagem")).toHaveCount(0);
});
