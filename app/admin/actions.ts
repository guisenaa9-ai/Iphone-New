"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { settingsSchema } from "@/lib/settings";
import { STORE_TAG } from "@/lib/supabase/public";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });

async function admin() {
  const ctx = await requireAdmin();
  if (!ctx.isAdmin) throw new Error("forbidden");
  return ctx.supabase;
}

function done(id?: string): ActionResult {
  updateTag(STORE_TAG); // a loja reflete a mudança na próxima visita
  revalidatePath("/admin", "layout");
  return { ok: true, id };
}

const imageUrl = z.string().url().max(500);

const variantSchema = z
  .object({
    id: z.string().uuid().optional(),
    sku: z.string().trim().max(60).optional().default(""),
    color_name: z.string().trim().max(40).optional().default(""),
    color_hex: z.union([z.literal(""), z.string().regex(/^#[0-9a-fA-F]{6}$/)]).optional().default(""),
    storage: z.string().trim().max(20).optional().default(""),
    condition: z.enum(["novo", "seminovo", "recondicionado"]),
    battery_health: z.union([z.literal(""), z.number().int().min(1).max(100)]).optional().default(""),
    price_cents: z.number().int().min(1, "Preço obrigatório").max(100_000_000),
    compare_at_cents: z.number().int().positive().nullable().optional(),
    stock: z.number().int().min(0).max(99_999),
    images: z.array(imageUrl).max(10).default([]),
    is_active: z.boolean().default(true),
  })
  .refine((v) => !v.compare_at_cents || v.compare_at_cents > v.price_cents, {
    message: "O preço “de” precisa ser maior que o preço atual",
    path: ["compare_at_cents"],
  });

const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífens").max(80),
  name: z.string().trim().min(2, "Informe o nome").max(120),
  category: z.enum(["iphone", "ipad", "mac", "watch", "airpods", "acessorio"]),
  family: z.string().trim().max(40).optional().default(""),
  description: z.string().max(3000).default(""),
  specs: z.array(z.object({ label: z.string().trim().min(1).max(40), value: z.string().trim().min(1).max(200) })).max(20).default([]),
  images: z.array(imageUrl).max(10).default([]),
  warranty: z.string().max(300).default(""),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  is_launch: z.boolean(),
  sort_order: z.number().int().min(0).max(9999).default(0),
  variants: z.array(variantSchema).min(1, "Cadastre ao menos uma variante").max(60),
});

export async function saveProduct(input: unknown): Promise<ActionResult> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return fail(`${i.path.join(" › ")}: ${i.message}`);
  }
  const supabase = await admin();
  const payload = {
    ...parsed.data,
    variants: parsed.data.variants.map((v, i) => ({ ...v, sort_order: i })),
  };
  const { data, error } = await supabase.rpc("admin_save_product", { payload });
  if (error) {
    if (error.message.includes("products_slug_key")) return fail("Já existe um produto com este endereço (slug).");
    if (error.message.includes("product_variants_sku_idx")) return fail("Há um SKU repetido em outro produto.");
    console.error("admin_save_product:", error.message);
    return fail("Não foi possível salvar o produto.");
  }
  return done(data as string);
}

export async function setProductActive(id: string, active: boolean): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return fail("Produto inválido");
  const supabase = await admin();
  const { error } = await supabase.from("products").update({ is_active: active }).eq("id", id);
  return error ? fail("Não foi possível atualizar.") : done();
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return fail("Produto inválido");
  const supabase = await admin();
  // Pedidos antigos guardam nome e preço, então o histórico não se perde.
  const { error } = await supabase.from("products").delete().eq("id", id);
  return error ? fail("Não foi possível excluir.") : done();
}

export async function setOrderStatus(id: string, status: string): Promise<ActionResult> {
  const supabase = await admin();
  const { error } = await supabase.rpc("admin_set_order_status", { order_id: id, new_status: status });
  if (error) {
    const known: Record<string, string> = {
      online_paid_requires_provider: "Pedidos online só ficam pagos com a confirmação do provedor.",
      online_not_paid: "Este pedido online ainda não teve o pagamento confirmado.",
      order_canceled: "Pedidos cancelados não podem mudar de status.",
    };
    return fail(known[error.message] ?? "Não foi possível atualizar o pedido.");
  }
  return done();
}

export async function saveSettings(input: unknown): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return fail(`${i.path.join(" › ")}: ${i.message}`);
  }
  const supabase = await admin();
  const { error } = await supabase.from("store_settings").update({ data: parsed.data }).eq("id", 1);
  if (error) return fail("Não foi possível salvar as configurações.");
  revalidatePath("/", "layout");
  return done();
}

const zoneSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(80),
  fee_cents: z.number().int().min(0).max(1_000_000),
  eta: z.string().trim().max(60).default(""),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).max(999).default(0),
});

export async function saveZone(input: unknown): Promise<ActionResult> {
  const parsed = zoneSchema.safeParse(input);
  if (!parsed.success) return fail("Informe o nome do bairro e uma taxa válida.");
  const supabase = await admin();
  const { id, ...row } = parsed.data;
  const { error } = id ? await supabase.from("delivery_zones").update(row).eq("id", id) : await supabase.from("delivery_zones").insert(row);
  return error ? fail("Não foi possível salvar o bairro.") : done();
}

export async function deleteZone(id: string): Promise<ActionResult> {
  const supabase = await admin();
  const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
  return error ? fail("Não foi possível excluir.") : done();
}

const reviewSchema = z.object({
  id: z.string().uuid().optional(),
  customer_name: z.string().trim().min(2).max(80),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(2).max(1000),
  source: z.string().trim().max(40).default(""),
  is_published: z.boolean().default(false),
});

export async function saveReview(input: unknown): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return fail("Preencha nome, nota e texto da avaliação.");
  const supabase = await admin();
  const { id, ...row } = parsed.data;
  const { error } = id ? await supabase.from("reviews").update(row).eq("id", id) : await supabase.from("reviews").insert(row);
  return error ? fail("Não foi possível salvar a avaliação.") : done();
}

export async function deleteReview(id: string): Promise<ActionResult> {
  const supabase = await admin();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  return error ? fail("Não foi possível excluir.") : done();
}

export async function setTradeInStatus(id: string, status: string): Promise<ActionResult> {
  if (!["new", "contacted", "closed"].includes(status)) return fail("Status inválido");
  const supabase = await admin();
  const { error } = await supabase.from("trade_in_requests").update({ status }).eq("id", id);
  return error ? fail("Não foi possível atualizar.") : done();
}
