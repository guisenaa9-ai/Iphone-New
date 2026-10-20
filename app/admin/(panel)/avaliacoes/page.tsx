import { ReviewsEditor } from "@/components/admin/crud-editors";
import { PageHeader } from "@/components/admin/table";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Avaliações" };

export default async function Reviews() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
  return (
    <>
      <PageHeader title="Avaliações de clientes" />
      <p className="-mt-3 mb-6 max-w-2xl text-[14px] text-muted">Cadastre apenas avaliações reais, com autorização do cliente (por exemplo, transcritas do Google ou do Instagram). Só as publicadas aparecem na loja.</p>
      <ReviewsEditor reviews={data ?? []} />
    </>
  );
}
