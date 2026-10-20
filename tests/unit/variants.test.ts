import { describe, expect, it } from "vitest";
import type { Variant } from "@/lib/catalog";
import { defaultVariant, isOptionAvailable, pickVariant, selectionOf } from "@/lib/variants";

let n = 0;
const v = (storage: string, color: string, price: number, stock: number, condition: Variant["condition"] = "novo"): Variant => ({
  id: `v${++n}`, product_id: "p", sku: null, color_name: color, color_hex: "#000000", storage, condition,
  battery_health: null, price_cents: price, compare_at_cents: null, stock, images: [], is_active: true, sort_order: n,
});

const variants = [
  v("128 GB", "Preto", 1000, 0),
  v("128 GB", "Branco", 1000, 3),
  v("256 GB", "Preto", 1200, 2),
  v("512 GB", "Azul", 1500, 1),
];

describe("variantes", () => {
  it("começa pela mais barata com estoque", () => {
    expect(defaultVariant(variants).id).toBe(variants[1].id);
  });

  it("respeita a variante do link (?v=)", () => {
    expect(defaultVariant(variants, variants[3].id).id).toBe(variants[3].id);
  });

  it("ao trocar armazenamento mantém a cor quando existe a combinação", () => {
    const cur = selectionOf(variants[0]); // 128 Preto
    expect(pickVariant(variants, cur, "storage", "256 GB").id).toBe(variants[2].id);
  });

  it("quando a combinação não existe, troca para a mais próxima", () => {
    const cur = selectionOf(variants[1]); // 128 Branco
    const picked = pickVariant(variants, cur, "storage", "512 GB");
    expect(picked.storage).toBe("512 GB");
    expect(picked.color_name).toBe("Azul");
  });

  it("marca opções impossíveis com a seleção atual", () => {
    const cur = selectionOf(variants[1]); // 128 Branco
    expect(isOptionAvailable(variants, cur, "storage", "128 GB")).toBe(true);
    expect(isOptionAvailable(variants, cur, "storage", "256 GB")).toBe(false);
    expect(isOptionAvailable(variants, cur, "color_name", "Preto")).toBe(true);
  });
});
