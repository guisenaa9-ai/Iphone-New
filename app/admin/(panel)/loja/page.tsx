import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/table";
import { requireAdmin } from "@/lib/admin";
import { paymentsConfigured } from "@/lib/mercadopago";
import { resolveSettings } from "@/lib/settings";

export const metadata = { title: "Personalizar loja" };

export default async function StoreSettingsPage() {
  const { supabase } = await requireAdmin();
  // Lê direto (sem cache) para editar sempre a versão mais recente.
  const { data } = await supabase.from("store_settings").select("data").eq("id", 1).maybeSingle();
  return (
    <>
      <PageHeader title="Personalizar loja" />
      <SettingsForm initial={resolveSettings(data?.data ?? {})} paymentsReady={paymentsConfigured()} />
    </>
  );
}
