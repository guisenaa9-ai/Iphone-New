import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { PageHeader, Table } from "@/components/admin/table";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { requireAdmin } from "@/lib/admin";
import { CATEGORY_LABEL, PRODUCT_SELECT, getSettings, type Product } from "@/lib/catalog";
import { formatBRL } from "@/lib/money";

export const metadata = { title: "Produtos" };

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string; estoque?: string }> }) {
  const { q = "", estoque } = await searchParams;
  const [{ supabase }, s] = await Promise.all([requireAdmin(), getSettings()]);
  let query = supabase.from("products").select(PRODUCT_SELECT).order("sort_order").order("created_at", { ascending: false });
  if (q) query = query.ilike("name", `%${q.replace(/[%_,()]/g, "")}%`);
  const { data } = await query;
  let products = (data ?? []) as Product[];
  const low = (p: Product) => p.variants.some((v) => v.is_active && v.stock <= s.commerce.lowStockThreshold);
  if (estoque === "baixo") products = products.filter(low);

  return (
    <>
      <PageHeader title="Produtos">
        <ButtonLink href="/admin/produtos/novo"><Plus aria-hidden className="size-4" /> Novo produto</ButtonLink>
      </PageHeader>
      <form className="mb-5 flex flex-wrap gap-3" role="search">
        <Input name="q" defaultValue={q} placeholder="Buscar por nome" aria-label="Buscar produtos" className="max-w-xs" />
        <label className="flex h-11 items-center gap-2 text-[14px]">
          <input type="checkbox" name="estoque" value="baixo" defaultChecked={estoque === "baixo"} className="size-4" /> Só estoque baixo
        </label>
        <button className="h-11 rounded-full px-4 text-[14px] ring-1 ring-border">Filtrar</button>
      </form>
      {products.length === 0 ? (
        <EmptyState icon={Package} title={q || estoque ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"} action={<ButtonLink href="/admin/produtos/novo">Cadastrar produto</ButtonLink>} />
      ) : (
        <Table caption="Produtos" head={["Produto", "Categoria", "Variantes", "A partir de", "Estoque", "Status", ""]}>
          {products.map((p) => {
            const active = p.variants.filter((v) => v.is_active);
            const min = active.length ? Math.min(...active.map((v) => v.price_cents)) : null;
            const stock = active.reduce((n, v) => n + v.stock, 0);
            return (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/produtos/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                  <div className="mt-1 flex gap-1.5">
                    {p.is_featured && <Badge>Destaque</Badge>}
                    {p.is_launch && <Badge>Lançamento</Badge>}
                    {p.variants.some((v) => v.compare_at_cents) && <Badge tone="accent">Oferta</Badge>}
                  </div>
                </td>
                <td className="text-muted">{CATEGORY_LABEL[p.category]}</td>
                <td className="tabular-nums">{p.variants.length}</td>
                <td className="tabular-nums">{min ? formatBRL(min) : "—"}</td>
                <td className={`tabular-nums ${low(p) ? "font-medium text-warning" : ""}`}>{stock}</td>
                <td>{p.is_active ? <Badge tone="success">Ativo</Badge> : <Badge>Inativo</Badge>}</td>
                <td className="text-right"><ProductRowActions id={p.id} name={p.name} active={p.is_active} /></td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
