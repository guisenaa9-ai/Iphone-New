import { ZonesEditor } from "@/components/admin/crud-editors";
import { PageHeader } from "@/components/admin/table";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Entregas" };

export default async function Zones() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("delivery_zones").select("*").order("sort_order").order("name");
  return (
    <>
      <PageHeader title="Bairros e taxas de entrega" />
      <p className="-mt-3 mb-6 max-w-2xl text-[14px] text-muted">A taxa é somada no fechamento do pedido conforme o bairro escolhido. Ative a entrega em Personalizar loja › Vendas.</p>
      <ZonesEditor zones={data ?? []} />
    </>
  );
}
