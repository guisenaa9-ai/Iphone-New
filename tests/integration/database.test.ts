import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

// Testa as regras do banco (RLS e funções de pedido) contra um Supabase real ou local.
// Roda com: SUPABASE_TEST=1 npm run test:db (usa .env.local; NUNCA aponte para a loja em produção).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const opts = { auth: { persistSession: false } };

let anon: SupabaseClient;
let service: SupabaseClient;
let variant: { id: string; price_cents: number; stock: number };

const order = (over: Record<string, unknown> = {}) => ({
  channel: "whatsapp",
  fulfillment: "pickup",
  customer: { name: "Cliente Teste", phone: "92991234567" },
  items: [{ variant_id: variant.id, quantity: 1 }],
  ...over,
});

describe.runIf(process.env.SUPABASE_TEST === "1")("banco de dados", () => {
  beforeAll(async () => {
    anon = createClient(url, anonKey, opts);
    service = createClient(url, serviceKey, opts);
    const { data } = await service.from("product_variants").select("id, price_cents, stock").gt("stock", 10).limit(1).single();
    variant = data!;
  });

  it("visitante não lê pedidos nem altera produtos", async () => {
    const { data } = await anon.from("orders").select("id");
    expect(data).toEqual([]);
    const { error } = await anon.from("products").update({ name: "hack" }).eq("is_active", true).select();
    expect(error ?? null).toBeNull(); // RLS: update silencioso sem linhas
    const { data: still } = await service.from("products").select("name").eq("name", "hack");
    expect(still).toEqual([]);
  });

  it("preço vem do banco e o estoque é baixado", async () => {
    const { data, error } = await anon.rpc("place_order", { payload: order({ items: [{ variant_id: variant.id, quantity: 2, unit_price_cents: 1 }] }) });
    expect(error).toBeNull();
    expect(data.total_cents).toBe(variant.price_cents * 2);
    const { data: after } = await service.from("product_variants").select("stock").eq("id", variant.id).single();
    expect(after!.stock).toBe(variant.stock - 2);
    variant.stock -= 2;
  });

  it("recusa estoque insuficiente sem criar pedido", async () => {
    const { data: scarce } = await service.from("product_variants").select("id, stock").gt("stock", 0).lt("stock", 10).limit(1).single();
    const before = (await service.from("orders").select("id", { count: "exact", head: true })).count;
    const { error } = await anon.rpc("place_order", { payload: order({ items: [{ variant_id: scarce!.id, quantity: 10 }] }) });
    expect(error?.message).toMatch(/^insufficient_stock/);
    expect((await service.from("orders").select("id", { count: "exact", head: true })).count).toBe(before);
    expect((await service.from("product_variants").select("stock").eq("id", scarce!.id).single()).data!.stock).toBe(scarce!.stock);
  });

  it("valida telefone e entrega", async () => {
    expect((await anon.rpc("place_order", { payload: order({ customer: { name: "A B", phone: "123" } }) })).error?.message).toBe("invalid_phone");
    expect((await anon.rpc("place_order", { payload: order({ fulfillment: "delivery" }) })).error?.message).toMatch(/invalid_zone|delivery_disabled/);
  });

  it("visitante não confirma pagamento nem muda status", async () => {
    const { data } = await anon.rpc("place_order", { payload: order() });
    expect((await anon.rpc("confirm_payment", { order_id: data.id, provider: "x", provider_payment_id: "1", provider_status: "approved", amount_cents: data.total_cents })).error).not.toBeNull();
    expect((await anon.rpc("admin_set_order_status", { order_id: data.id, new_status: "paid" })).error).not.toBeNull();
    const { data: pub } = await anon.rpc("get_order_public", { order_id: data.id });
    expect(pub.status).toBe("pending");
  });

  it("pagamento só aprova com valor exato", async () => {
    const { data: s } = await service.from("store_settings").select("data").eq("id", 1).single();
    await service.from("store_settings").update({ data: { ...s!.data, commerce: { ...s!.data.commerce, salesMode: "both" } } }).eq("id", 1);
    const { data, error: placeErr } = await anon.rpc("place_order", { payload: order({ channel: "online" }) });
    expect(placeErr).toBeNull();
    expect((await service.rpc("confirm_payment", { order_id: data.id, provider: "mercadopago", provider_payment_id: "9", provider_status: "approved", amount_cents: data.total_cents - 1 })).data).toBe("amount_mismatch");
    expect((await service.rpc("confirm_payment", { order_id: data.id, provider: "mercadopago", provider_payment_id: "9", provider_status: "approved", amount_cents: data.total_cents })).data).toBe("paid");
    const { data: pub } = await anon.rpc("get_order_public", { order_id: data.id });
    expect(pub).toMatchObject({ status: "paid", payment_status: "approved" });
    await service.from("store_settings").update({ data: s!.data }).eq("id", 1);
  });

  it("release_order devolve o estoque de pedido online não pago", async () => {
    const { data: s } = await service.from("store_settings").select("data").eq("id", 1).single();
    await service.from("store_settings").update({ data: { ...s!.data, commerce: { ...s!.data.commerce, salesMode: "both" } } }).eq("id", 1);
    const before = (await service.from("product_variants").select("stock").eq("id", variant.id).single()).data!.stock;
    const { data, error: placeErr } = await anon.rpc("place_order", { payload: order({ channel: "online" }) });
    expect(placeErr).toBeNull();
    await service.rpc("release_order", { order_id: data.id });
    const after = (await service.from("product_variants").select("stock").eq("id", variant.id).single()).data!.stock;
    expect(after).toBe(before);
    expect((await anon.rpc("release_order", { order_id: data.id })).error).not.toBeNull();
    await service.from("store_settings").update({ data: s!.data }).eq("id", 1);
  });

  it("pedido de WhatsApp abandonado devolve o estoque após 48h", async () => {
    const stockOf = async () => (await service.from("product_variants").select("stock").eq("id", variant.id).single()).data!.stock;
    const before = await stockOf();
    const { data } = await anon.rpc("place_order", { payload: order() });
    expect(await stockOf()).toBe(before - 1);
    await service.from("orders").update({ created_at: new Date(Date.now() - 49 * 3600_000).toISOString() }).eq("id", data.id);
    const { data: next } = await anon.rpc("place_order", { payload: order() }); // dispara a limpeza
    expect((await anon.rpc("get_order_public", { order_id: data.id })).data.status).toBe("canceled");
    expect(await stockOf()).toBe(before - 1); // só o pedido novo segura estoque
    await service.rpc("release_order", { order_id: next.id });
  });
});
