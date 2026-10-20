import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { requireAdmin } from "@/lib/admin";
import { formatBRL } from "@/lib/money";

type Dash = {
  products_total: number;
  products_active: number;
  low_stock: number;
  orders_total: number;
  orders_pending: number;
  orders_completed: number;
  revenue_cents: number;
  revenue_by_day: { day: string; cents: number }[];
  top_products: { name: string; units: number; cents: number }[];
  low_stock_items: { product_id: string; name: string; storage: string | null; color_name: string | null; stock: number }[];
};

const RANGES = [7, 30, 90];

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const dias = RANGES.includes(Number((await searchParams).dias)) ? Number((await searchParams).dias) : 30;
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("admin_dashboard", { days: dias });
  if (error || !data) return <p className="text-danger">Não foi possível carregar os indicadores.</p>;
  const d = data as Dash;

  const tiles: [string, string, string?, string?][] = [
    ["Receita paga", formatBRL(d.revenue_cents), `últimos ${dias} dias`],
    ["Pedidos recebidos", String(d.orders_total), `últimos ${dias} dias`, "/admin/pedidos"],
    ["Pedidos pendentes", String(d.orders_pending), "aguardando ação", "/admin/pedidos?status=pending"],
    ["Pedidos concluídos", String(d.orders_completed), `últimos ${dias} dias`, "/admin/pedidos?status=completed"],
    ["Produtos ativos", `${d.products_active}`, `de ${d.products_total} cadastrados`, "/admin/produtos"],
    ["Estoque baixo", String(d.low_stock), "variantes", "/admin/produtos?estoque=baixo"],
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <h1 className="text-title">Visão geral</h1>
        <nav aria-label="Período" className="inline-flex rounded-full bg-surface p-1 ring-1 ring-border">
          {RANGES.map((r) => (
            <Link key={r} href={`/admin?dias=${r}`} aria-current={r === dias ? "true" : undefined} className={`inline-flex h-9 items-center rounded-full px-4 text-[14px] ${r === dias ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}>
              {r} dias
            </Link>
          ))}
        </nav>
      </div>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {tiles.map(([label, value, hint, href]) => {
          const body = (
            <>
              <p className="text-[13px] text-muted">{label}</p>
              <p className="mt-1 text-[26px] font-semibold tracking-[-0.02em] tabular-nums">{value}</p>
              {hint && <p className="text-[12px] text-muted">{hint}</p>}
            </>
          );
          return (
            <li key={label}>
              {href ? (
                <Link href={href} className="block h-full rounded-[20px] bg-surface p-5 ring-1 ring-border transition-shadow hover:ring-border-strong">{body}</Link>
              ) : (
                <div className="h-full rounded-[20px] bg-surface p-5 ring-1 ring-border">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <section className="rounded-[24px] bg-surface p-6 ring-1 ring-border">
        <h2 className="text-headline mb-1">Receita paga por dia</h2>
        <p className="mb-5 text-[13px] text-muted">Somente pedidos com pagamento confirmado.</p>
        <RevenueChart data={d.revenue_by_day} />
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <section className="rounded-[24px] bg-surface p-6 ring-1 ring-border">
          <h2 className="text-headline mb-4">Mais vendidos</h2>
          {d.top_products.length ? (
            <ol className="flex flex-col gap-3">
              {d.top_products.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 text-[15px]">
                  <span className="grid size-7 place-items-center rounded-full bg-bg-subtle text-[13px] font-semibold">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="text-muted tabular-nums">{p.units} un.</span>
                  <span className="w-28 text-right tabular-nums">{formatBRL(p.cents)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[15px] text-muted">Ainda não há vendas pagas no período.</p>
          )}
        </section>
        <section className="rounded-[24px] bg-surface p-6 ring-1 ring-border">
          <h2 className="text-headline mb-4 flex items-center gap-2">
            <AlertTriangle aria-hidden className="size-5 text-warning" /> Estoque baixo
          </h2>
          {d.low_stock_items.length ? (
            <ul className="flex flex-col gap-2.5">
              {d.low_stock_items.map((v, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-[15px]">
                  <Link href={`/admin/produtos/${v.product_id}`} className="min-w-0 truncate hover:underline">
                    {v.name} <span className="text-muted">{[v.storage, v.color_name].filter(Boolean).join(" · ")}</span>
                  </Link>
                  <span className={`shrink-0 font-medium tabular-nums ${v.stock === 0 ? "text-danger" : "text-warning"}`}>{v.stock === 0 ? "Esgotado" : `${v.stock} un.`}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[15px] text-muted">Nenhuma variante com estoque baixo.</p>
          )}
        </section>
      </div>
    </div>
  );
}
