import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/table";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata = { title: "Novo produto" };

export default function NewProduct() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Produtos", href: "/admin/produtos" }, { label: "Novo" }]} />
      <div className="mt-3"><PageHeader title="Novo produto" /></div>
      <ProductForm />
    </>
  );
}
