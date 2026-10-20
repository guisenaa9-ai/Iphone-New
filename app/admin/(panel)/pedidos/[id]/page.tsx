import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { OrderActions } from "@/components/admin/order-actions";
import { OrderStatusBadge } from "@/components/admin/order-status";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { requireAdmin } from "@/lib/admin";
import { formatBRL } from "@/lib/money";
import { waLink } from "@/lib/whatsapp";

export const metadata = { title: "Pedido" };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdmin();
  const { data: o } = await supabase.from("orders").select("*, items:order_items(*)").eq("id", id).maybeSingle();
  if (!o) notFound();
  const phone = o.customer_phone.length <= 11 ? `55${o.customer_phone}` : o.customer_phone;
  const when = (d: string) => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Manaus" });

  return (
    <div className="grid max-w-4xl gap-6">
      <Breadcrumbs items={[{ label: "Pedidos", href: "/admin/pedidos" }, { label: o.code }]} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-title">{o.code}</h1>
        <OrderStatusBadge status={o.status} payment={o.payment_status} />
      </div>
      <OrderActions id={o.id} status={o.status} channel={o.channel} paymentStatus={o.payment_status} />

      <div className="grid gap-6 md:grid-cols-2">
        <section className="grid content-start gap-2 rounded-[24px] bg-surface p-6 text-[15px] ring-1 ring-border">
          <h2 className="text-headline mb-2">Cliente</h2>
          <p className="font-medium">{o.customer_name}</p>
          <p className="text-muted">{o.customer_phone}{o.customer_email && ` · ${o.customer_email}`}</p>
          <a href={waLink(phone, `Olá, ${o.customer_name.split(" ")[0]}! Sobre o seu pedido ${o.code}.`)} target="_blank" rel="noopener" className="mt-2 inline-flex h-10 w-fit items-center gap-2 rounded-full bg-[#1f9d55] px-4 text-[14px] font-medium text-white">
            <MessageCircle aria-hidden className="size-4" /> Chamar no WhatsApp
          </a>
        </section>
        <section className="grid content-start gap-2 rounded-[24px] bg-surface p-6 text-[15px] ring-1 ring-border">
          <h2 className="text-headline mb-2">Entrega e pagamento</h2>
          <p>{o.fulfillment === "pickup" ? "Retirada na loja" : `Entrega — ${o.delivery_zone_name ?? ""}`}</p>
          {o.address && <p className="text-muted">{o.address}</p>}
          <p className="text-muted">Canal: {o.channel === "whatsapp" ? "WhatsApp" : "Checkout online"}</p>
          {o.payment_provider && <p className="text-muted">Pagamento: {o.payment_provider} #{o.payment_id}</p>}
          <p className="text-muted">Criado em {when(o.created_at)}{o.paid_at && ` · pago em ${when(o.paid_at)}`}</p>
          {o.notes && <p className="mt-2 whitespace-pre-line rounded-[12px] bg-bg-subtle p-3 text-[14px]">{o.notes}</p>}
        </section>
      </div>

      <section className="rounded-[24px] bg-surface p-6 ring-1 ring-border">
        <h2 className="text-headline mb-4">Itens</h2>
        <ul className="grid gap-3 border-b border-border pb-4 text-[15px]">
          {(o.items as { id: string; product_name: string; variant_label: string; quantity: number; unit_price_cents: number }[]).map((i) => (
            <li key={i.id} className="flex justify-between gap-4">
              <span>{i.quantity}x {i.product_name}<span className="block text-[13px] text-muted">{i.variant_label}</span></span>
              <span className="tabular-nums">{formatBRL(i.unit_price_cents * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="grid gap-1.5 pt-4 text-[15px]">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatBRL(o.subtotal_cents)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Entrega</dt><dd className="tabular-nums">{formatBRL(o.delivery_fee_cents)}</dd></div>
          <div className="flex justify-between pt-2 text-[18px] font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatBRL(o.total_cents)}</dd></div>
        </dl>
      </section>
    </div>
  );
}
