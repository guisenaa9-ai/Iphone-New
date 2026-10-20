import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout-form";
import { getDeliveryZones, getSettings } from "@/lib/catalog";
import { paymentsConfigured } from "@/lib/mercadopago";
import { canSellOnline, canSellWhatsApp } from "@/lib/settings";

export const metadata: Metadata = { title: "Finalizar pedido", robots: { index: false } };

export default async function CheckoutPage() {
  const [s, zones] = await Promise.all([getSettings(), getDeliveryZones()]);
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="text-title mb-8">Finalizar pedido</h1>
      <CheckoutForm
        storeName={s.brand.name}
        commerce={s.commerce}
        zones={zones}
        address={s.contact.address}
        mapsUrl={s.contact.mapsUrl}
        channels={{ whatsapp: canSellWhatsApp(s), online: canSellOnline(s, paymentsConfigured()) }}
      />
    </div>
  );
}
