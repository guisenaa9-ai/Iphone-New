import { createHmac, timingSafeEqual } from "node:crypto";

// Integração Mercado Pago via API REST (sem SDK). Só roda no servidor.
// Docs: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro

const API = "https://api.mercadopago.com";

export const paymentsConfigured = () => !!process.env.MERCADOPAGO_ACCESS_TOKEN && !!process.env.MERCADOPAGO_WEBHOOK_SECRET;

type PrefInput = {
  orderId: string;
  code: string;
  items: { name: string; variant: string; quantity: number; unit_price_cents: number }[];
  deliveryFeeCents: number;
  payerEmail?: string | null;
  maxInstallments: number;
  siteUrl: string;
  holdMinutes: number;
};

export async function createPreference(p: PrefInput): Promise<string> {
  const items = p.items.map((i) => ({
    title: i.variant ? `${i.name} (${i.variant})` : i.name,
    quantity: i.quantity,
    unit_price: i.unit_price_cents / 100,
    currency_id: "BRL",
  }));
  if (p.deliveryFeeCents > 0) items.push({ title: "Entrega", quantity: 1, unit_price: p.deliveryFeeCents / 100, currency_id: "BRL" });
  const back = `${p.siteUrl}/pedido/${p.orderId}`;
  const res = await fetch(`${API}/checkout/preferences`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": p.orderId,
    },
    body: JSON.stringify({
      items,
      external_reference: p.orderId,
      statement_descriptor: p.code.slice(0, 13),
      notification_url: `${p.siteUrl}/api/webhooks/mercadopago`,
      back_urls: { success: back, pending: back, failure: back },
      auto_return: "approved",
      payer: p.payerEmail ? { email: p.payerEmail } : undefined,
      payment_methods: { installments: p.maxInstallments },
      expires: true,
      expiration_date_to: new Date(Date.now() + p.holdMinutes * 60_000).toISOString(),
    }),
  });
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { init_point?: string };
  if (!data.init_point) throw new Error("Mercado Pago não retornou init_point");
  return data.init_point;
}

export type MpPayment = { id: number; status: string; external_reference: string | null; transaction_amount: number };

export async function getPayment(id: string): Promise<MpPayment> {
  const res = await fetch(`${API}/v1/payments/${encodeURIComponent(id)}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}`);
  return res.json();
}

/**
 * Valida o cabeçalho x-signature do webhook.
 * Manifesto: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" assinado com HMAC-SHA256.
 */
export function verifySignature(opts: { signature: string | null; requestId: string | null; dataId: string | null; secret: string; maxAgeSeconds?: number; now?: number }) {
  if (!opts.signature || !opts.dataId) return false;
  const parts = Object.fromEntries(
    opts.signature.split(",").map((kv) => {
      const [k, ...v] = kv.trim().split("=");
      return [k, v.join("=")];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1 || !/^[0-9a-f]{64}$/i.test(v1)) return false;
  // ts em segundos (aceita milissegundos por segurança); rejeita notificações antigas (replay).
  const tsSeconds = Number(ts) > 1e12 ? Number(ts) / 1000 : Number(ts);
  const age = (opts.now ?? Date.now()) / 1000 - tsSeconds;
  if (!Number.isFinite(age) || Math.abs(age) > (opts.maxAgeSeconds ?? 600)) return false;
  const id = /^[a-z0-9]+$/i.test(opts.dataId) ? opts.dataId.toLowerCase() : opts.dataId;
  let manifest = `id:${id};`;
  if (opts.requestId) manifest += `request-id:${opts.requestId};`;
  manifest += `ts:${ts};`;
  const expected = createHmac("sha256", opts.secret).update(manifest).digest("hex");
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(v1, "hex"));
}
