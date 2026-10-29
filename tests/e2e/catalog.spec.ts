import { expect, test } from "@playwright/test";

test("filters the catalogue by text and category", async ({ page }) => {
  await page.goto("/pt/biblioteca");
  await expect(page.getByTestId("book-card")).toHaveCount(11);

  await page.getByLabel("Buscar no acervo").fill("evangelho");
  await expect(page.getByTestId("book-card")).toHaveCount(1);
  await expect(page.getByTestId("book-card")).toContainText("O Evangelho segundo o Espiritismo");

  await page.getByLabel("Buscar no acervo").fill("");
  await page.locator("#category-select").click();
  await page.getByRole("option", { name: "Mediunidade" }).click();
  await expect(page.getByTestId("book-card")).toHaveCount(2);
  await expect(page.getByTestId("book-card").first()).toContainText("O Livro dos Médiuns");
});

test("honours category deep links and opens an edition", async ({ page }) => {
  await page.goto("/pt/biblioteca?categoria=fundamentos");
  await expect(page.getByTestId("book-card")).toHaveCount(3);
  await page.getByRole("link", { name: "O Livro dos Espíritos" }).first().click();
  await expect(page).toHaveURL(/\/pt\/livro\/o-livro-dos-espiritos$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("O Livro dos Espíritos");
  await expect(page.getByRole("link", { name: /Ler obra completa/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "EPUB" })).toHaveAttribute(
    "href",
    "/books/o-livro-dos-espiritos.epub",
  );
});

test("documents provenance and active-rights author profiles", async ({ page }) => {
  await page.goto("/pt/livro/o-livro-dos-espiritos");
  await expect(page.getByRole("heading", { name: "Fonte e licença" })).toBeVisible();
  await expect(page.getByText("Licenciado pela FEB").first()).toBeVisible();
  await expect(page.getByText("Introdução", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Federação Espírita Brasileira/ }).first(),
  ).toHaveAttribute("href", "https://www.febeditora.com.br/");

  await page.goto("/pt/sobre");
  await expect(page.getByRole("heading", { name: "Autores com direitos ativos" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chico Xavier" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Divaldo Pereira Franco" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Yvonne do Amaral Pereira" })).toBeVisible();
  await expect(page.getByRole("link", { name: /FEB Editora/ }).first()).toHaveAttribute(
    "href",
    "https://www.febeditora.com.br/",
  );
});

test("clears filters and shows the empty state", async ({ page }) => {
  await page.goto("/pt/biblioteca");
  await page.getByLabel("Buscar no acervo").fill("termo inexistente xyz");
  await expect(page.getByRole("heading", { name: "Nenhuma obra encontrada" })).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).first().click();
  await expect(page.getByTestId("book-card")).toHaveCount(11);
});
