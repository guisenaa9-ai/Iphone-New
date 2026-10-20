import { expect, test } from "@playwright/test";

const brl = (s: string | null) => (s ?? "").replace(/\s/g, " ");

test("home mostra hero, vitrines e rodapé com aviso de marca", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explorar iPhones" })).toBeVisible();
  await expect(page.getByText("sem vínculo com a Apple Inc.")).toBeVisible();
});

test("variante muda preço e disponibilidade", async ({ page }) => {
  await page.goto("/produto/iphone-16-pro");
  const price = page.locator("span.text-\\[32px\\]");
  const first = brl(await price.textContent());
  await page.getByRole("button", { name: "256 GB" }).click();
  await expect(price).not.toHaveText(first);
  expect(page.url()).toContain("v=");
  // Combinação sem estoque desabilita a compra
  await page.goto("/produto/iphone-16-pro-max");
  await page.getByRole("button", { name: "Titânio-branco", exact: true }).click();
  await page.getByRole("button", { name: "256 GB" }).click();
  await expect(page.getByText("Indisponível nesta combinação")).toBeVisible();
});

test("catálogo filtra por condição e busca", async ({ page }) => {
  await page.goto("/catalogo?condicao=seminovo");
  await expect(page.getByRole("heading", { name: "iPhones seminovos" })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(2);
  await page.goto("/catalogo?q=carregador");
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Carregador USB-C 20 W" }).first()).toBeVisible();
});

test("carrinho e pedido pelo WhatsApp", async ({ page, context }) => {
  // Não sai para a internet: responde o wa.me localmente e confere a URL gerada.
  await context.route(/https:\/\/(wa\.me|api\.whatsapp\.com)\/.*/, (r) => r.fulfill({ body: "whatsapp", contentType: "text/plain" }));
  await page.goto("/produto/carregador-usb-c-20w");
  await page.getByRole("button", { name: /Adicionar/ }).first().click();
  await expect(page.getByText("adicionado ao carrinho")).toBeVisible();
  await page.goto("/carrinho");
  await page.getByRole("button", { name: "Aumentar" }).click();
  await expect(page.getByText("R$ 398,00").first()).toBeVisible();
  await page.getByRole("link", { name: "Continuar", exact: true }).click();

  await page.getByLabel("Nome completo").fill("Cliente E2E");
  await page.getByLabel("Celular (WhatsApp)").fill("92991234567");
  await page.getByRole("button", { name: /Entrega/ }).click();
  await page.getByLabel("Bairro").selectOption({ label: "Aleixo — R$ 15,00" });
  await page.getByLabel("Endereço completo").fill("Rua Teste, 100");
  await expect(page.getByText("R$ 413,00")).toBeVisible();
  await page.getByRole("checkbox").check();

  const popup = context.waitForEvent("page");
  await page.getByRole("button", { name: "Finalizar pelo WhatsApp" }).click();
  const wa = await popup;
  await wa.waitForURL(/wa\.me/, { waitUntil: "commit" });
  const url = decodeURIComponent(wa.url()).replace(/\u00a0/g, " ");
  expect(url).toContain("NOVA-");
  expect(url).toContain("2x Carregador USB-C 20 W");
  expect(url).toContain("*Total: R$ 413,00*");
  await expect(page.getByRole("heading", { name: /Pedido NOVA-\d+ registrado/ })).toBeVisible();
});

test("avaliação de troca é enviada", async ({ page }) => {
  await page.goto("/troca");
  await page.getByLabel("Seu nome").fill("Cliente Troca");
  await page.getByLabel("Celular com DDD").fill("(92) 99123-4567");
  await page.getByLabel("Modelo do aparelho").fill("iPhone 12");
  await page.getByLabel("Estado do aparelho").fill("Tela sem riscos, bateria original");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Solicitar avaliação" }).click();
  await expect(page.getByText("Pedido de avaliação enviado")).toBeVisible();
});

test("menu mobile abre e navega", async ({ page, isMobile }) => {
  test.skip(!isMobile, "só no celular");
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.locator("#menu-mobile").getByRole("link", { name: "Seminovos" }).click();
  await expect(page).toHaveURL(/condicao=seminovo/);
});
