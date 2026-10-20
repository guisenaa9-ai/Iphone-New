import { expect, test, type Page } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

async function login(page: Page) {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("E-mail").fill(email!);
  await page.getByLabel("Senha").fill(password!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
}

test.describe("painel", () => {
  test.skip(!email || !password, "defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD");
  test.skip(({ isMobile }) => isMobile, "fluxo administrativo testado no desktop");

  test("rota protegida e senha errada", async ({ page }) => {
    await page.goto("/admin/produtos");
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.getByLabel("E-mail").fill(email!);
    await page.getByLabel("Senha").fill("errada-123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
  });

  test("cadastra produto com variantes e ele aparece na loja", async ({ page }) => {
    await login(page);
    await page.goto("/admin/produtos/novo");
    const name = `Película de vidro E2E ${Date.now()}`;
    await page.getByLabel("Nome", { exact: true }).fill(name);
    await page.getByLabel("Categoria").selectOption("acessorio");
    await page.getByLabel("Preço (R$)").fill("79,90");
    await page.getByLabel("Estoque").fill("7");
    await page.getByRole("button", { name: "Salvar produto" }).click();
    await expect(page.getByText("Produto salvo")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/produtos\/[0-9a-f-]{36}/);

    const slug = await page.getByLabel("Endereço na loja").inputValue();
    await page.goto(`/produto/${slug}`);
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.locator("span.text-\\[32px\\]")).toHaveText(/R\$\s79,90/);
  });

  test("troca a cor da marca sem editar código", async ({ page }) => {
    await login(page);
    await page.goto("/admin/loja");
    await page.locator("#b-accent").fill("#0a84ff");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText("Configurações salvas")).toBeVisible();
    await page.goto("/");
    const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim());
    expect(accent).toBe("#0a84ff");
    // volta para a cor da demonstração
    await page.goto("/admin/loja");
    await page.locator("#b-accent").fill("#c9a46c");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText("Configurações salvas")).toBeVisible();
  });

  test("pedido do WhatsApp: marcar como pago e cancelar devolve estoque", async ({ page }) => {
    await login(page);
    await page.goto("/admin/pedidos?status=pending");
    const first = page.getByRole("link", { name: /^NOVA-\d+$/ }).first();
    test.skip((await first.count()) === 0, "sem pedidos pendentes (rode storefront.spec antes)");
    await first.click();
    await page.getByRole("button", { name: "Marcar como pago" }).click();
    await expect(page.getByText("Pedido marcado como pago")).toBeVisible();
    await page.reload();
    await expect(page.getByText("Pago", { exact: true })).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Cancelar pedido" }).click();
    await expect(page.getByText("Pedido cancelado e estoque devolvido")).toBeVisible();
  });
});
