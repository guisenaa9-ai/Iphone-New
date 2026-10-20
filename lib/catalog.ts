import { cache } from "react";
import { publicClient } from "./supabase/public";
import { resolveSettings } from "./settings";

export type Condition = "novo" | "seminovo" | "recondicionado";
export type Category = "iphone" | "ipad" | "mac" | "watch" | "airpods" | "acessorio";

export const CATEGORY_LABEL: Record<Category, string> = {
  iphone: "iPhone",
  ipad: "iPad",
  mac: "Mac",
  watch: "Watch",
  airpods: "AirPods",
  acessorio: "Acessórios",
};

export const CONDITION_LABEL: Record<Condition, string> = {
  novo: "Novo",
  seminovo: "Seminovo",
  recondicionado: "Recondicionado",
};

export type Variant = {
  id: string;
  product_id: string;
  sku: string | null;
  color_name: string | null;
  color_hex: string | null;
  storage: string | null;
  condition: Condition;
  battery_health: number | null;
  price_cents: number;
  compare_at_cents: number | null;
  stock: number;
  images: string[];
  is_active: boolean;
  sort_order: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  family: string | null;
  description: string;
  specs: { label: string; value: string }[];
  images: string[];
  warranty: string;
  is_active: boolean;
  is_featured: boolean;
  is_launch: boolean;
  sort_order: number;
  created_at: string;
  variants: Variant[];
};

export const PRODUCT_SELECT = "*, variants:product_variants(*)";

export const getSettings = cache(async () => {
  const { data, error } = await publicClient().from("store_settings").select("data").eq("id", 1).maybeSingle();
  if (error) console.error("settings:", error.message);
  return resolveSettings(data?.data ?? {});
});

function normalize(p: Product): Product {
  const variants = p.variants.filter((v) => v.is_active).sort((a, b) => a.sort_order - b.sort_order || a.price_cents - b.price_cents);
  return { ...p, variants };
}

// shortcut: carrega o catálogo inteiro e filtra em memória; ótimo até ~1.000 produtos.
// Acima disso, mova os filtros para a consulta (range/ilike) e pagine no banco.
export const getProducts = cache(async (): Promise<Product[]> => {
  const { data, error } = await publicClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("products:", error.message);
    return [];
  }
  return (data as Product[]).map(normalize).filter((p) => p.variants.length > 0);
});

export const getProduct = cache(async (slug: string) => (await getProducts()).find((p) => p.slug === slug) ?? null);

export const getBestSellerIds = cache(async () => {
  const { data } = await publicClient().rpc("best_sellers", { limit_count: 8 });
  return ((data ?? []) as { product_id: string }[]).map((r) => r.product_id);
});

export const getReviews = cache(async () => {
  const { data } = await publicClient()
    .from("reviews")
    .select("id, customer_name, rating, body, source, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(9);
  return data ?? [];
});

export const getDeliveryZones = cache(async () => {
  const { data } = await publicClient()
    .from("delivery_zones")
    .select("id, name, fee_cents, eta")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  return (data ?? []) as { id: string; name: string; fee_cents: number; eta: string }[];
});

// ---------------------------------------------------------------------------
// Derivações usadas em cards, filtros e página de produto
// ---------------------------------------------------------------------------
export const cheapest = (p: Product) => p.variants.reduce((a, b) => (b.price_cents < a.price_cents ? b : a));
export const inStock = (p: Product) => p.variants.some((v) => v.stock > 0);
export const onSale = (p: Product) => p.variants.some((v) => v.compare_at_cents);
export const isUsed = (p: Product) => p.variants.some((v) => v.condition !== "novo");
export const variantImages = (p: Product, v?: Variant | null) => (v?.images.length ? v.images : p.images);

export function variantLabel(v: Pick<Variant, "storage" | "color_name" | "condition">) {
  return [v.storage, v.color_name, v.condition !== "novo" ? CONDITION_LABEL[v.condition] : null]
    .filter(Boolean)
    .join(" · ");
}

export function colorsOf(p: Product) {
  const seen = new Map<string, string | null>();
  for (const v of p.variants) if (v.color_name && !seen.has(v.color_name)) seen.set(v.color_name, v.color_hex);
  return [...seen].map(([name, hex]) => ({ name, hex }));
}

export type CatalogQuery = {
  q?: string;
  categoria?: string;
  linha?: string;
  armazenamento?: string;
  cor?: string;
  condicao?: string;
  disponivel?: string;
  ofertas?: string;
  ordem?: string;
};

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Filtros do catálogo. Um produto passa se ALGUMA variante atende a todos os filtros de variante. */
export function filterProducts(all: Product[], f: CatalogQuery) {
  const words = f.q ? fold(f.q).split(/\s+/).filter(Boolean) : [];
  const list = all.filter((p) => {
    if (f.categoria && p.category !== f.categoria) return false;
    if (f.linha && p.family !== f.linha) return false;
    if (words.length) {
      const hay = fold(`${p.name} ${p.family ?? ""} ${CATEGORY_LABEL[p.category]} ${p.variants.map((v) => `${v.storage} ${v.color_name}`).join(" ")}`);
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return p.variants.some(
      (v) =>
        (!f.armazenamento || v.storage === f.armazenamento) &&
        (!f.cor || v.color_name === f.cor) &&
        (!f.condicao || v.condition === f.condicao) &&
        (!f.disponivel || v.stock > 0) &&
        (!f.ofertas || v.compare_at_cents),
    );
  });
  const price = (p: Product) => cheapest(p).price_cents;
  switch (f.ordem) {
    case "menor-preco":
      return list.sort((a, b) => price(a) - price(b));
    case "maior-preco":
      return list.sort((a, b) => price(b) - price(a));
    case "novidades":
      return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    default:
      return list;
  }
}

/** Opções dos filtros, derivadas do próprio catálogo (sem listas fixas no código). */
export function facets(all: Product[]) {
  const uniq = (xs: (string | null)[]) => [...new Set(xs.filter((x): x is string => !!x))];
  const variants = all.flatMap((p) => p.variants);
  const storageValue = (s: string) => parseFloat(s) * (/tb/i.test(s) ? 1024 : 1);
  return {
    categorias: uniq(all.map((p) => p.category)) as Category[],
    linhas: uniq(all.map((p) => p.family)).sort((a, b) => b.localeCompare(a, "pt-BR", { numeric: true })),
    armazenamentos: uniq(variants.map((v) => v.storage)).sort((a, b) => storageValue(a) - storageValue(b)),
    cores: uniq(variants.map((v) => v.color_name)).sort((a, b) => a.localeCompare(b, "pt-BR")),
    condicoes: uniq(variants.map((v) => v.condition)) as Condition[],
  };
}
