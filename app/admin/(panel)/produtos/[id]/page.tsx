import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/table";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { requireAdmin } from "@/lib/admin";
import { PRODUCT_SELECT, type Product } from "@/lib/catalog";

export const metadata = { title: "Editar produto" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  if (!data) notFound();
  const p = data as Product;
  return (
    <>
      <Breadcrumbs items={[{ label: "Produtos", href: "/admin/produtos" }, { label: p.name }]} />
      <div className="mt-3">
        <PageHeader title={p.name}>
          {p.is_active && <Link href={`/produto/${p.slug}`} target="_blank" className="inline-flex h-10 items-center rounded-full px-4 text-[14px] ring-1 ring-border">Ver na loja</Link>}
        </PageHeader>
      </div>
      <ProductForm key={p.id} product={p} />
    </>
  );
}
