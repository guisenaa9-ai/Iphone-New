import { z } from "zod";

// Configuração central da loja (white label). Fica em store_settings.data no banco,
// é editada em /admin/loja e aplicada ao site sem mexer em código.
// DEFAULT_SETTINGS só preenche o que a loja ainda não configurou: são valores neutros,
// sem telefone, endereço ou condição comercial inventada.

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor no formato #RRGGBB");
const url = z.union([z.literal(""), z.string().url("URL inválida").max(500)]);
const href = z.string().max(300);
const text = (max: number) => z.string().max(max);

export const FONT_OPTIONS = {
  inter: "Inter",
  manrope: "Manrope",
  jakarta: "Plus Jakarta Sans",
  dmsans: "DM Sans",
} as const;

export const settingsSchema = z.object({
  brand: z.object({
    name: z.string().min(2, "Informe o nome da loja").max(60),
    tagline: text(120),
    logoUrl: url,
    logoDarkUrl: url,
    faviconUrl: url,
    accent: hex,
    font: z.enum(Object.keys(FONT_OPTIONS) as [keyof typeof FONT_OPTIONS]),
    theme: z.enum(["system", "light", "dark"]),
  }),
  contact: z.object({
    whatsapp: z.string().regex(/^\d{0,13}$/, "Somente números com DDI e DDD, ex.: 5592999999999"),
    phone: text(30),
    email: z.union([z.literal(""), z.string().email("E-mail inválido")]),
    address: text(200),
    mapsUrl: url,
    hours: text(300),
    instagram: url,
    facebook: url,
    tiktok: url,
  }),
  hero: z.object({
    eyebrow: text(60),
    title: z.string().min(2).max(80),
    subtitle: text(200),
    imageUrl: url,
    primaryLabel: text(30),
    primaryHref: href,
    secondaryLabel: text(30),
    secondaryHref: href,
  }),
  banners: z
    .array(
      z.object({
        title: z.string().min(2).max(80),
        subtitle: text(160),
        imageUrl: url,
        href: href,
        startsAt: text(10), // AAAA-MM-DD; vazio = sem limite
        endsAt: text(10),
        active: z.boolean(),
      }),
    )
    .max(6),
  content: z.object({
    about: text(3000),
    benefits: z.array(z.object({ title: z.string().min(2).max(60), text: text(200) })).max(6),
    faq: z.array(z.object({ q: z.string().min(2).max(160), a: z.string().min(2).max(1200) })).max(16),
    legalName: text(120),
    cnpj: text(20),
    demoNotice: z.boolean(),
  }),
  commerce: z.object({
    salesMode: z.enum(["whatsapp", "online", "both"]),
    pickupEnabled: z.boolean(),
    pickupInfo: text(300),
    deliveryEnabled: z.boolean(),
    deliveryInfo: text(300),
    paymentInfo: text(300),
    orderPrefix: z.string().regex(/^[A-Za-z0-9]{0,6}$/, "Até 6 letras ou números"),
    installmentsMax: z.number().int().min(1).max(24),
    installmentsInterestFree: z.number().int().min(1).max(24),
    installmentsMonthlyRate: z.number().min(0).max(15), // % ao mês acima do sem-juros
    lowStockThreshold: z.number().int().min(0).max(100),
  }),
  seo: z.object({
    title: text(70),
    description: text(170),
    ogImageUrl: url,
  }),
  analytics: z.object({
    ga4Id: z.union([z.literal(""), z.string().regex(/^G-[A-Z0-9]+$/, "ID do GA4 começa com G-")]),
    metaPixelId: z.string().regex(/^\d{0,20}$/, "Somente números"),
  }),
});

export type StoreSettings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: StoreSettings = {
  brand: {
    name: "Minha Loja",
    tagline: "",
    logoUrl: "",
    logoDarkUrl: "",
    faviconUrl: "",
    accent: "#0a84ff",
    font: "inter",
    theme: "system",
  },
  contact: {
    whatsapp: "",
    phone: "",
    email: "",
    address: "",
    mapsUrl: "",
    hours: "",
    instagram: "",
    facebook: "",
    tiktok: "",
  },
  hero: {
    eyebrow: "",
    title: "Bem-vindo",
    subtitle: "",
    imageUrl: "",
    primaryLabel: "Explorar iPhones",
    primaryHref: "/catalogo?categoria=iphone",
    secondaryLabel: "Ver ofertas",
    secondaryHref: "/catalogo?ofertas=1",
  },
  banners: [],
  content: { about: "", benefits: [], faq: [], legalName: "", cnpj: "", demoNotice: false },
  commerce: {
    salesMode: "whatsapp",
    pickupEnabled: true,
    pickupInfo: "",
    deliveryEnabled: false,
    deliveryInfo: "",
    paymentInfo: "",
    orderPrefix: "PED",
    installmentsMax: 1,
    installmentsInterestFree: 1,
    installmentsMonthlyRate: 0,
    lowStockThreshold: 2,
  },
  seo: { title: "", description: "", ogImageUrl: "" },
  analytics: { ga4Id: "", metaPixelId: "" },
};

type Plain = Record<string, unknown>;
const isPlain = (v: unknown): v is Plain => typeof v === "object" && v !== null && !Array.isArray(v);

function merge<T>(base: T, over: unknown): T {
  if (!isPlain(base) || !isPlain(over)) return (over === undefined ? base : over) as T;
  const out: Plain = { ...base };
  for (const key of Object.keys(base)) if (key in over) out[key] = merge((base as Plain)[key], over[key]);
  return out as T;
}

/** Completa o JSON salvo com os padrões. Campos inválidos voltam ao padrão, sem derrubar o site. */
export function resolveSettings(raw: unknown): StoreSettings {
  const merged = merge(DEFAULT_SETTINGS, raw);
  const parsed = settingsSchema.safeParse(merged);
  if (parsed.success) return parsed.data;
  const fixed = structuredClone(merged) as Plain;
  for (const issue of parsed.error.issues) {
    let target: unknown = fixed;
    let fallback: unknown = DEFAULT_SETTINGS;
    const path = issue.path.slice(0, 2); // seção.campo (ou seção.índice)
    for (let i = 0; i < path.length - 1; i++) {
      target = (target as Plain)[path[i] as string];
      fallback = (fallback as Plain)?.[path[i] as string];
    }
    const last = path[path.length - 1] as string;
    if (isPlain(target)) target[last] = isPlain(fallback) ? fallback[last] : undefined;
    else if (Array.isArray(target)) target.splice(Number(last), 1);
  }
  const retry = settingsSchema.safeParse(fixed);
  return retry.success ? retry.data : DEFAULT_SETTINGS;
}

export function canSellWhatsApp(s: StoreSettings) {
  return s.commerce.salesMode !== "online" && s.contact.whatsapp.length >= 12;
}

export function canSellOnline(s: StoreSettings, paymentsConfigured: boolean) {
  return s.commerce.salesMode !== "whatsapp" && paymentsConfigured;
}

export function activeBanners(s: StoreSettings, today = new Date().toISOString().slice(0, 10)) {
  return s.banners.filter(
    (b) => b.active && (!b.startsAt || b.startsAt <= today) && (!b.endsAt || b.endsAt >= today),
  );
}
