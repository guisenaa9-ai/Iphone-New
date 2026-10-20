import type { Condition, Variant } from "./catalog";

export type Axis = "storage" | "color_name" | "condition";
export type Selection = { storage: string | null; color_name: string | null; condition: Condition | null };

export const AXES: Axis[] = ["storage", "color_name", "condition"];

export const selectionOf = (v: Variant): Selection => ({ storage: v.storage, color_name: v.color_name, condition: v.condition });

/** Valores distintos de um eixo, na ordem em que aparecem nas variantes. */
export function optionsFor(variants: Variant[], axis: Axis) {
  return [...new Set(variants.map((v) => v[axis]).filter((x): x is NonNullable<typeof x> => x != null))] as string[];
}

const matches = (v: Variant, sel: Partial<Selection>) => AXES.every((a) => sel[a] == null || v[a] === sel[a]);

/** Existe variante com este valor, mantendo as outras escolhas? (para riscar opções impossíveis) */
export function isOptionAvailable(variants: Variant[], sel: Selection, axis: Axis, value: string) {
  return variants.some((v) => v[axis] === value && matches(v, { ...sel, [axis]: value }));
}

/**
 * Ao escolher um valor, mantém o máximo das escolhas anteriores.
 * Preferência: combinação exata > mesma prioridade de eixos > com estoque > mais barata.
 */
export function pickVariant(variants: Variant[], current: Selection, axis: Axis, value: string): Variant {
  const pool = variants.filter((v) => v[axis] === value);
  const score = (v: Variant) =>
    AXES.reduce((s, a, i) => s + (a !== axis && v[a] === current[a] ? 2 ** (AXES.length - i) : 0), 0) + (v.stock > 0 ? 0.5 : 0);
  return pool.reduce((best, v) => {
    const d = score(v) - score(best);
    return d > 0 || (d === 0 && v.price_cents < best.price_cents) ? v : best;
  });
}

/** Variante inicial: a mais barata com estoque, ou a mais barata. */
export function defaultVariant(variants: Variant[], preferredId?: string | null) {
  const pref = preferredId && variants.find((v) => v.id === preferredId);
  if (pref) return pref;
  const inStock = variants.filter((v) => v.stock > 0);
  const pool = inStock.length ? inStock : variants;
  return pool.reduce((a, b) => (b.price_cents < a.price_cents ? b : a));
}
