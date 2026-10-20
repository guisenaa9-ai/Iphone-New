"use server";

import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { getSettings } from "@/lib/catalog";
import { createPreference, paymentsConfigured } from "@/lib/mercadopago";
import { canSellOnline, canSellWhatsApp } from "@/lib/settings";
import { anonClient, STORE_TAG } from "@/lib/supabase/public";
import { serviceClient } from "@/lib/supabase/service";
import { orderMessage, waLink } from "@/lib/whatsapp";

// Igual ao prazo de release_expired_orders() no banco.
const HOLD_MINUTES = 60;

const ERRORS: Record<string, string> = {
  channel_disabled: "Esta forma de finalização não está disponível no momento.",
  invalid_name: "Informe seu nome.",
  invalid_phone: "Informe um celular válido com DDD.",
  invalid_email: "E-mail inválido.",
  invalid_zone: "Escolha um bairro atendido.",
  invalid_address: "Informe o endereço de entrega.",
  pickup_disabled: "A retirada na loja não está disponível.",
  delivery_disabled: "A entrega não está disponível.",
  variant_unavailable: "Um dos produtos não está mais disponível.",
  insufficient_stock: "Um dos produtos não tem estoque suficiente. Revise o carrinho.",
  invalid_quantity: "Quantidade inválida.",
};

function friendly(message: string) {
  const key = Object.keys(ERRORS).find((k) => message.startsWith(k));
  return key ? ERRORS[key] : "Não foi possível registrar o pedido. Tente novamente.";
}

/** Preço e estoque atuais das variantes do carrinho (o navegador só guarda uma cópia). */
export async function quoteCart(variantIds: string[]) {
  const ids = z.array(z.string().uuid()).max(30).safeParse(variantIds);
  if (!ids.success || !ids.data.length) return {};
  const { data } = await anonClient()
    .from("product_variants")
    .select("id, price_cents, stock")
    .in("id", ids.data);
  // Variantes desativadas não voltam (RLS), então ficam de fora: o carrinho as marca como indisponíveis.
  const out: Record<string, { priceCents: number; stock: number }> = {};
  for (const v of data ?? []) out[v.id] = { priceCents: v.price_cents, stock: v.stock };
  return out;
}

const orderSchema = z.object({
  channel: z.enum(["whatsapp", "online"]),
  fulfillment: z.enum(["pickup", "delivery"]),
  zone_id: z.string().uuid().optional(),
  address: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().max(20),
    email: z.union([z.literal(""), z.string().email().max(120)]).optional(),
  }),
  items: z
    .array(z.object({ variant_id: z.string().uuid(), quantity: z.number().int().min(1).max(10) }))
    .min(1)
    .max(20),
  privacy: z.literal(true),
});

export type PlaceOrderResult =
  | { ok: true; channel: "whatsapp"; orderId: string; code: string; whatsappUrl: string }
  | { ok: true; channel: "online"; orderId: string; code: string; redirectUrl: string }
  | { ok: false; error: string };

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revise os dados do pedido." };
  const o = parsed.data;
  const s = await getSettings();

  if (o.channel === "whatsapp" && !canSellWhatsApp(s)) return { ok: false, error: ERRORS.channel_disabled };
  if (o.channel === "online" && !canSellOnline(s, paymentsConfigured())) return { ok: false, error: ERRORS.channel_disabled };

  const { privacy: _privacy, ...payload } = o;
  const { data, error } = await anonClient().rpc("place_order", { payload });
  if (error) {
    if (!/^(invalid_|insufficient_|variant_|channel_|pickup_|delivery_)/.test(error.message)) console.error("place_order:", error.message);
    return { ok: false, error: friendly(error.message) };
  }
  const order = data as {
    id: string;
    code: string;
    subtotal_cents: number;
    delivery_fee_cents: number;
    total_cents: number;
    items: { name: string; variant: string; quantity: number; unit_price_cents: number }[];
  };
  revalidateTag(STORE_TAG, "max"); // estoque mudou

  if (o.channel === "whatsapp") {
    const zone = o.zone_id ? (await anonClient().from("delivery_zones").select("name").eq("id", o.zone_id).maybeSingle()).data : null;
    const text = orderMessage(s.brand.name, order, {
      name: o.customer.name,
      fulfillment: o.fulfillment,
      zoneName: zone?.name,
      address: o.address,
      notes: o.notes,
    });
    return { ok: true, channel: "whatsapp", orderId: order.id, code: order.code, whatsappUrl: waLink(s.contact.whatsapp, text) };
  }

  const h = await headers();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  try {
    const redirectUrl = await createPreference({
      orderId: order.id,
      code: order.code,
      items: order.items,
      deliveryFeeCents: order.delivery_fee_cents,
      payerEmail: o.customer.email || null,
      maxInstallments: s.commerce.installmentsMax,
      siteUrl,
      holdMinutes: HOLD_MINUTES,
    });
    return { ok: true, channel: "online", orderId: order.id, code: order.code, redirectUrl };
  } catch (e) {
    console.error("mercadopago preference:", e);
    await serviceClient().rpc("release_order", { order_id: order.id });
    return { ok: false, error: "O pagamento online está indisponível agora. Tente novamente ou finalize pelo WhatsApp." };
  }
}

const tradeInSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().max(20),
  device_model: z.string().trim().min(2).max(80),
  storage: z.string().max(20).optional(),
  battery_health: z.union([z.literal(""), z.coerce.number().int().min(1).max(100)]).optional(),
  device_condition: z.string().trim().min(2).max(1000),
  desired_product: z.string().max(120).optional(),
  privacy: z.literal("on"),
});

export type TradeInState = { ok?: boolean; error?: string; whatsappUrl?: string } | null;

export async function submitTradeIn(_: TradeInState, form: FormData): Promise<TradeInState> {
  const parsed = tradeInSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Preencha nome, celular, modelo e estado do aparelho e aceite a política de privacidade." };
  const { privacy: _p, ...payload } = parsed.data;
  const { error } = await anonClient().rpc("submit_trade_in", { payload: { ...payload, battery_health: payload.battery_health || "" } });
  if (error) return { error: error.message.startsWith("invalid") ? "Confira os dados informados (celular com DDD)." : "Não foi possível enviar agora. Tente novamente." };
  const s = await getSettings();
  const p = parsed.data;
  const text = `Olá, ${s.brand.name}! Enviei pelo site um pedido de avaliação do meu ${p.device_model}${p.storage ? ` ${p.storage}` : ""}${p.battery_health ? `, bateria ${p.battery_health}%` : ""}. Estado: ${p.device_condition}${p.desired_product ? `. Tenho interesse em: ${p.desired_product}` : ""}.`;
  return { ok: true, whatsappUrl: s.contact.whatsapp ? waLink(s.contact.whatsapp, text) : undefined };
}
