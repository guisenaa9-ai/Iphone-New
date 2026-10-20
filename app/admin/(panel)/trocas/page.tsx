import { Repeat } from "lucide-react";
import { TradeInStatus } from "@/components/admin/crud-editors";
import { PageHeader, Table } from "@/components/admin/table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAdmin } from "@/lib/admin";
import { waLink } from "@/lib/whatsapp";

export const metadata = { title: "Trocas" };

export default async function TradeIns() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("trade_in_requests").select("*").order("created_at", { ascending: false }).limit(200);
  return (
    <>
      <PageHeader title="Avaliações de aparelho usado" />
      {!data?.length ? (
        <EmptyState icon={Repeat} title="Nenhuma solicitação ainda" text="Pedidos enviados em “Avaliar meu aparelho” aparecem aqui." />
      ) : (
        <Table caption="Solicitações de troca" head={["Cliente", "Aparelho", "Estado informado", "Interesse", "Recebido", "Status"]}>
          {data.map((t) => (
            <tr key={t.id}>
              <td>
                {t.customer_name}
                <a href={waLink(t.customer_phone.length <= 11 ? `55${t.customer_phone}` : t.customer_phone, `Olá, ${t.customer_name.split(" ")[0]}! Sobre a avaliação do seu ${t.device_model}.`)} target="_blank" rel="noopener" className="block text-[12px] text-muted underline">{t.customer_phone}</a>
              </td>
              <td>{t.device_model}<span className="block text-[12px] text-muted">{[t.storage, t.battery_health && `bateria ${t.battery_health}%`].filter(Boolean).join(" · ")}</span></td>
              <td className="max-w-xs whitespace-pre-line text-muted">{t.device_condition}</td>
              <td className="text-muted">{t.desired_product || "—"}</td>
              <td className="whitespace-nowrap text-muted">{new Date(t.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Manaus" })}</td>
              <td><TradeInStatus id={t.id} status={t.status} /></td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
