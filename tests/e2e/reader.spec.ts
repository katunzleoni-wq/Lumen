import { expect, test } from "@playwright/test";

test("opens the complete EPUB, changes reading theme and navigates", async ({ page }) => {
  await page.goto("/pt/livro/o-livro-dos-espiritos");
  await page.getByRole("link", { name: /Ler obra completa/ }).click();
  await expect(page).toHaveURL(/\/pt\/ler\/o-livro-dos-espiritos$/);
  await expect(page.getByTestId("reader-shell")).toBeVisible();

  const frame = page.frameLocator("iframe");
  await expect(frame.locator("body")).toContainText(
    /LUMEN|NOTE SUR CETTE ÉDITION|LE LIVRE DES ESPRITS/i,
    {
      timeout: 20_000,
    },
  );

  await page.getByRole("button", { name: "Ajustes de leitura" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("radio", { name: /Noturno/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();

  await expect(frame.locator("body")).toHaveCSS("background-color", "rgb(21, 27, 25)");

  await page.getByRole("button", { name: "Próxima" }).click();
  await expect(frame.locator("body")).toContainText(/[A-ZÀ-Ý]{4,}/, { timeout: 15_000 });
});

test("opens and navigates the public-domain PDF", async ({ page }) => {
  await page.goto("/pt/ler/instrucao-pratica-sobre-as-manifestacoes-espiritas?formato=pdf");
  await expect(page.getByTestId("reader-shell")).toHaveAttribute("data-reader-format", "pdf");
  await expect(page.locator(".react-pdf__Page canvas").first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Página 1 de 164")).toBeVisible();

  await page.getByRole("button", { name: "Próxima" }).click();
  await expect(page.getByText("Página 2 de 164")).toBeVisible();
  await expect(page.locator('.react-pdf__Page[data-page-number="2"]')).toBeVisible();

  const width = await page.locator('.react-pdf__Page[data-page-number="2"]').evaluate((node) => {
    return node.getBoundingClientRect().width;
  });
  expect(width).toBeGreaterThan(500);
});

test("switches format from the reader toolbar", async ({ page }) => {
  await page.goto("/pt/ler/instrucao-pratica-sobre-as-manifestacoes-espiritas");
  await page.getByRole("button", { name: "PDF" }).click();
  await expect(page.getByTestId("reader-shell")).toHaveAttribute("data-reader-format", "pdf");
  await expect(page.locator(".react-pdf__Page canvas").first()).toBeVisible({
    timeout: 30_000,
  });
});

test("navigates through the EPUB table of contents", async ({ page }) => {
  await page.goto("/pt/ler/o-livro-dos-espiritos");
  const frame = page.frameLocator("iframe");
  await expect(frame.locator("body")).toContainText(/LUMEN|NOTE SUR CETTE ÉDITION/i, {
    timeout: 20_000,
  });

  await page.getByRole("button", { name: "Abrir sumário" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Sumário" })).toBeVisible();
  await dialog.getByRole("button", { name: "Introduction — I", exact: true }).click();
  await expect(frame.locator("body")).toContainText("Pour les choses nouvelles", {
    timeout: 15_000,
  });
});

test("opens the FEB-authorized Portuguese edition and switches format", async ({ page }) => {
  await page.goto("/pt/livro/o-livro-dos-mediuns");
  await expect(
    page.getByRole("heading", { name: "Português — tradução de Guillon Ribeiro" }),
  ).toBeVisible();
  const readLink = page.getByRole("link", { name: "Ler nesta edição" });
  await expect(readLink).toHaveAttribute("href", "/pt/ler/o-livro-dos-mediuns?lang=pt&formato=pdf");
  await readLink.click();
  await expect(page.getByTestId("reader-shell")).toHaveAttribute("data-reader-format", "pdf");
  await expect(page.getByText(/Página 1 de \d+/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Português — tradução de Guillon Ribeiro")).toBeVisible();

  await page.getByRole("button", { name: "EPUB" }).click();
  await expect(page.getByTestId("reader-shell")).toHaveAttribute("data-reader-format", "epub");
  const frame = page.frameLocator("iframe");
  await expect(frame.locator("body")).toContainText("Nota sobre esta edição", {
    timeout: 20_000,
  });
});

test("restores reading progress from IndexedDB on the edition page", async ({ page }) => {
  await page.goto("/pt/ler/o-livro-dos-espiritos");
  await expect(page.locator("iframe")).toBeVisible();
  for (let index = 0; index < 4; index += 1) {
    await page.getByRole("button", { name: "Próxima" }).click();
    await page.waitForTimeout(350);
  }
  await expect(page.getByText(/[1-9]\d*% lido/).first()).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1_200);

  await page.goto("/pt/livro/o-livro-dos-espiritos");
  await expect(page.getByRole("link", { name: /Continuar leitura/ })).toBeVisible();
  await expect(page.getByText(/% lido/).first()).toBeVisible();
});
