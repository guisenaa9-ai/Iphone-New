import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { getSettings } from "@/lib/catalog";
import { formatBRL } from "@/lib/money";
import { anonClient } from "@/lib/supabase/public";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Seu pedido", robots: { index: false } };

type PublicOrder = {
  id: string;
  code: string;
  channel: "whatsapp" | "online";
  status: string;
  payment_status: string;
  subtotal_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
  items: { name: string; variant: string; quantity: number; unit_price_cents: number }[];
};

const STATUS: Record<string, { label: string; text: string; tone: "ok" | "wait" | "bad" }> = {
  pending: { label: "Pedido recebido", text: "A loja vai confirmar disponibilidade e combinar o pagamento com você.", tone: "wait" },
  awaiting_payment: { label: "Aguardando pagamento", text: "Assim que o provedor confirmar o pagamento, esta página será atualizada.", tone: "wait" },
  paid: { label: "Pagamento confirmado", text: "Recebemos a confirmação do pagamento. A loja vai preparar seu pedido.", tone: "ok" },
  completed: { label: "Pedido concluído", text: "Obrigado pela compra!", tone: "ok" },
  canceled: { label: "Pedido cancelado", text: "Este pedido foi cancelado. Se precisar, fale com a loja.", tone: "bad" },
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data }, s] = await Promise.all([anonClient().rpc("get_order_public", { order_id: id }), getSettings()]);
  const o = data as PublicOrder | null;
  if (!o) notFound();
  const st = STATUS[o.status] ?? STATUS.pending;
  const rejected = o.status === "awaiting_payment" && o.payment_status === "rejected";
  const Icon = st.tone === "ok" ? CheckCircle2 : st.tone === "bad" || rejected ? XCircle : Clock;

  return (
    <div className="container-page grid max-w-2xl gap-8 py-12">
      <div className="grid justify-items-center gap-3 text-center">
        <Icon aria-hidden className={`size-12 ${st.tone === "ok" ? "text-success" : st.tone === "bad" || rejected ? "text-danger" : "text-warning"}`} />
        <p className="text-eyebrow">Pedido {o.code}</p>
        <h1 className="text-title">{rejected ? "Pagamento não aprovado" : st.label}</h1>
        <p className="max-w-md text-[16px] text-muted">{rejected ? "O provedor recusou o pagamento. Você pode falar com a loja para tentar outra forma." : st.text}</p>
      </div>
      <section aria-label="Itens" className="rounded-[24px] bg-bg-subtle p-6">
        <ul className="grid gap-3 border-b border-border pb-4 text-[15px]">
          {o.items.map((i, n) => (
            <li key={n} className="flex justify-between gap-4">
              <span>
                {i.quantity}x {i.name}
                {i.variant && <span className="block text-[13px] text-muted">{i.variant}</span>}
              </span>
              <span>{formatBRL(i.unit_price_cents * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="grid gap-2 pt-4 text-[15px]">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatBRL(o.subtotal_cents)}</dd></div>
          {o.delivery_fee_cents > 0 && <div className="flex justify-between"><dt className="text-muted">Entrega</dt><dd>{formatBRL(o.delivery_fee_cents)}</dd></div>}
          <div className="flex justify-between pt-2 text-[18px] font-semibold"><dt>Total</dt><dd>{formatBRL(o.total_cents)}</dd></div>
        </dl>
      </section>
      <div className="flex flex-wrap justify-center gap-3">
        {s.contact.whatsapp && (
          <a href={waLink(s.contact.whatsapp, `Olá, ${s.brand.name}! Sobre o pedido ${o.code}.`)} target="_blank" rel="noopener" className="inline-flex h-11 items-center rounded-full bg-fg px-5 font-medium text-bg">
            Falar com a loja
          </a>
        )}
        <ButtonLink href="/catalogo" variant="secondary">Voltar ao catálogo</ButtonLink>
      </div>
    </div>
  );
}
