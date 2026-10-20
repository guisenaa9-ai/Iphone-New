import { NextResponse, type NextRequest } from "next/server";
import { getPayment, verifySignature } from "@/lib/mercadopago";
import { serviceClient } from "@/lib/supabase/service";

// Notificação do Mercado Pago. Nunca confia no corpo: valida a assinatura,
// consulta o pagamento direto na API e só então atualiza o pedido no banco.
export async function POST(req: NextRequest) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !process.env.MERCADOPAGO_ACCESS_TOKEN) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const url = new URL(req.url);
  const body = (await req.json().catch(() => ({}))) as { type?: string; data?: { id?: string | number } };
  const type = url.searchParams.get("type") ?? body.type;
  const dataId = url.searchParams.get("data.id") ?? (body.data?.id != null ? String(body.data.id) : null);

  const valid = verifySignature({ signature: req.headers.get("x-signature"), requestId: req.headers.get("x-request-id"), dataId, secret });
  if (!valid) return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  if (type !== "payment" || !dataId) return NextResponse.json({ ok: true, ignored: true });

  try {
    const payment = await getPayment(dataId);
    if (!payment.external_reference) return NextResponse.json({ ok: true, ignored: true });
    const { data, error } = await serviceClient().rpc("confirm_payment", {
      order_id: payment.external_reference,
      provider: "mercadopago",
      provider_payment_id: String(payment.id),
      provider_status: payment.status,
      amount_cents: Math.round(payment.transaction_amount * 100),
    });
    if (error) throw new Error(error.message);
    if (data === "amount_mismatch") console.error("webhook: valor divergente no pedido", payment.external_reference);
    return NextResponse.json({ ok: true, result: data });
  } catch (e) {
    console.error("webhook mercadopago:", e);
    // 500 faz o Mercado Pago tentar de novo mais tarde.
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
