import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { PageHeader, Table } from "@/components/admin/table";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusBadge, STATUS_LABEL } from "@/components/admin/order-status";
import { requireAdmin } from "@/lib/admin";
import { formatBRL } from "@/lib/money";

export const metadata = { title: "Pedidos" };

const FILTERS = ["", "pending", "awaiting_payment", "paid", "completed", "canceled"];

export default async function Orders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "", q = "" } = await searchParams;
  const { supabase } = await requireAdmin();
  let query = supabase.from("orders").select("id, code, channel, status, payment_status, customer_name, customer_phone, fulfillment, total_cents, created_at").order("created_at", { ascending: false }).limit(200);
  if (FILTERS.includes(status) && status) query = query.eq("status", status);
  const term = q.replace(/[%_,()]/g, "").trim();
  if (term) query = query.or(`code.ilike.%${term}%,customer_name.ilike.%${term}%,customer_phone.ilike.%${term.replace(/\D/g, "") || term}%`);
  const { data: orders } = await query;

  return (
    <>
      <PageHeader title="Pedidos" />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link key={f} href={f ? `/admin/pedidos?status=${f}` : "/admin/pedidos"} aria-current={f === status ? "true" : undefined} className={`inline-flex h-9 items-center rounded-full px-4 text-[13px] ring-1 ${f === status ? "bg-fg text-bg ring-fg" : "ring-border hover:ring-border-strong"}`}>
            {f ? STATUS_LABEL[f] : "Todos"}
          </Link>
        ))}
        <form role="search" className="ml-auto">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Código, nome ou celular" aria-label="Buscar pedidos" className="h-9 w-56 rounded-full bg-surface px-4 text-[14px] ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-accent" />
        </form>
      </div>
      {!orders?.length ? (
        <EmptyState icon={ShoppingCart} title="Nenhum pedido por aqui" text="Os pedidos feitos pelo site aparecem nesta lista." />
      ) : (
        <Table caption="Pedidos" head={["Pedido", "Cliente", "Canal", "Entrega", "Total", "Status", "Data"]}>
          {orders.map((o) => (
            <tr key={o.id}>
              <td><Link href={`/admin/pedidos/${o.id}`} className="font-medium hover:underline">{o.code}</Link></td>
              <td>{o.customer_name}<span className="block text-[12px] text-muted">{o.customer_phone}</span></td>
              <td>{o.channel === "whatsapp" ? "WhatsApp" : "Online"}</td>
              <td className="text-muted">{o.fulfillment === "pickup" ? "Retirada" : "Entrega"}</td>
              <td className="tabular-nums">{formatBRL(o.total_cents)}</td>
              <td><OrderStatusBadge status={o.status} payment={o.payment_status} /></td>
              <td className="whitespace-nowrap text-muted">{new Date(o.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Manaus" })}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
