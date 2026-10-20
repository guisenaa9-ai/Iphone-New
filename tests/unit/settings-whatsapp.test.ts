import { describe, expect, it } from "vitest";
import { activeBanners, canSellOnline, canSellWhatsApp, DEFAULT_SETTINGS, resolveSettings } from "@/lib/settings";
import { orderMessage, waLink } from "@/lib/whatsapp";
import { readableOn, contrast } from "@/lib/color";

describe("configuração white label", () => {
  it("preenche o que falta com padrões neutros", () => {
    const s = resolveSettings({ brand: { name: "Prime Cell" } });
    expect(s.brand.name).toBe("Prime Cell");
    expect(s.brand.accent).toBe(DEFAULT_SETTINGS.brand.accent);
    expect(s.contact.whatsapp).toBe("");
    expect(s.commerce.installmentsMax).toBe(1);
  });

  it("um campo inválido volta ao padrão sem derrubar o resto", () => {
    const s = resolveSettings({ brand: { name: "Alpha iPhones", accent: "red;}body{display:none" } });
    expect(s.brand.name).toBe("Alpha iPhones");
    expect(s.brand.accent).toBe(DEFAULT_SETTINGS.brand.accent);
  });

  it("canais de venda dependem da configuração real", () => {
    const s = resolveSettings({ contact: { whatsapp: "5592991234567" }, commerce: { salesMode: "both" } });
    expect(canSellWhatsApp(s)).toBe(true);
    expect(canSellOnline(s, false)).toBe(false);
    expect(canSellOnline(s, true)).toBe(true);
    expect(canSellWhatsApp(resolveSettings({ commerce: { salesMode: "whatsapp" } }))).toBe(false); // sem número
  });

  it("promoções respeitam as datas", () => {
    const s = resolveSettings({
      banners: [
        { title: "Black Friday", subtitle: "", imageUrl: "", href: "", startsAt: "2026-11-20", endsAt: "2026-11-30", active: true },
        { title: "Sempre", subtitle: "", imageUrl: "", href: "", startsAt: "", endsAt: "", active: true },
        { title: "Desligada", subtitle: "", imageUrl: "", href: "", startsAt: "", endsAt: "", active: false },
      ],
    });
    expect(activeBanners(s, "2026-11-25").map((b) => b.title)).toEqual(["Black Friday", "Sempre"]);
    expect(activeBanners(s, "2026-12-01").map((b) => b.title)).toEqual(["Sempre"]);
  });

  it("texto do botão sempre legível sobre a cor da marca", () => {
    for (const accent of ["#c9a46c", "#0a84ff", "#111111", "#ffd60a", "#34c759"]) {
      // Tons médios podem ficar entre 3:1 e 4.5:1 — o painel avisa o lojista nesses casos.
      expect(contrast(accent, readableOn(accent))).toBeGreaterThanOrEqual(3);
    }
    expect(readableOn("#c9a46c")).toBe("#111113");
  });
});

describe("mensagem do WhatsApp", () => {
  it("leva código, itens, entrega e total", () => {
    const msg = orderMessage(
      "NOVA iPHONE",
      {
        code: "NOVA-1001",
        items: [{ name: "iPhone 16", variant: "128 GB · Preto", quantity: 2, unit_price_cents: 679900 }],
        subtotal_cents: 1359800,
        delivery_fee_cents: 1500,
        total_cents: 1361300,
      },
      { name: "Ana", fulfillment: "delivery", zoneName: "Aleixo", address: "Rua A, 10" },
    ).replace(/ /g, " ");
    expect(msg).toContain("*NOVA-1001*");
    expect(msg).toContain("2x iPhone 16 (128 GB · Preto) — R$ 13.598,00");
    expect(msg).toContain("Entrega (Aleixo): R$ 15,00");
    expect(msg).toContain("*Total: R$ 13.613,00*");
    expect(msg).toContain("Entrega em: Rua A, 10");
  });

  it("gera link wa.me com texto codificado", () => {
    expect(waLink("+55 (92) 99999-0000", "Olá & tchau")).toBe("https://wa.me/5592999990000?text=Ol%C3%A1%20%26%20tchau");
  });
});

describe("prévias de prospecção", () => {
  it("aplicam marca e textos sem perder o resto da configuração", async () => {
    const { PREVIEWS } = await import("@/config/previews");
    const { withOverrides } = await import("@/lib/settings");
    const base = resolveSettings({ contact: { whatsapp: "5592900000000" }, commerce: { installmentsMax: 12 } });
    for (const [key, preset] of Object.entries(PREVIEWS)) {
      const s = withOverrides(base, preset);
      expect(s.brand.name, key).not.toBe(DEFAULT_SETTINGS.brand.name);
      expect(s.content.demoNotice, key).toBe(true); // prévia nunca se passa por loja real
      expect(s.contact.whatsapp, key).toBe("5592900000000"); // pedidos não vão para a loja
      expect(s.commerce.installmentsMax, key).toBe(12);
    }
  });
});

describe("URLs de imagem", () => {
  it("aceitam arquivo do próprio site e recusam caminhos estranhos", () => {
    expect(resolveSettings({ brand: { logoUrl: "/previews/rampage.jpg" } }).brand.logoUrl).toBe("/previews/rampage.jpg");
    expect(resolveSettings({ brand: { logoUrl: "javascript:alert(1)" } }).brand.logoUrl).toBe("");
    expect(resolveSettings({ brand: { logoUrl: "/a b\"onerror=x" } }).brand.logoUrl).toBe("");
    expect(resolveSettings({ contact: { mapsUrl: "https://maps.app.goo.gl/abc" } }).contact.mapsUrl).toBe("https://maps.app.goo.gl/abc");
  });
});
