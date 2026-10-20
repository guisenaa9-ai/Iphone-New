import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getDeliveryZones, getSettings } from "@/lib/catalog";
import { formatBRL } from "@/lib/money";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Sobre e contato" };

export default async function About() {
  const [s, zones] = await Promise.all([getSettings(), getDeliveryZones()]);
  const c = s.contact;
  return (
    <div className="container-page grid gap-16 py-10 sm:py-14">
      <section className="grid max-w-3xl gap-4">
        <p className="text-eyebrow">Sobre</p>
        <h1 className="text-title">{s.brand.name}</h1>
        {s.brand.tagline && <p className="text-[20px] leading-relaxed text-muted">{s.brand.tagline}</p>}
        {s.content.about && <div className="grid gap-4 whitespace-pre-line text-[17px] leading-relaxed">{s.content.about}</div>}
      </section>

      <section id="contato" className="grid gap-6">
        <h2 className="text-title">Contato</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {c.whatsapp && (
            <a href={waLink(c.whatsapp)} target="_blank" rel="noopener" className="grid gap-2 rounded-[24px] bg-bg-subtle p-6 transition-colors hover:bg-border/40">
              <MessageCircle aria-hidden className="size-6" />
              <span className="font-semibold">WhatsApp</span>
              <span className="text-muted">Atendimento e pedidos</span>
            </a>
          )}
          {c.phone && (
            <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="grid gap-2 rounded-[24px] bg-bg-subtle p-6 transition-colors hover:bg-border/40">
              <Phone aria-hidden className="size-6" />
              <span className="font-semibold">Telefone</span>
              <span className="text-muted">{c.phone}</span>
            </a>
          )}
          {c.email && (
            <a href={`mailto:${c.email}`} className="grid gap-2 rounded-[24px] bg-bg-subtle p-6 transition-colors hover:bg-border/40">
              <Mail aria-hidden className="size-6" />
              <span className="font-semibold">E-mail</span>
              <span className="break-all text-muted">{c.email}</span>
            </a>
          )}
          {c.address && (
            <div className="grid content-start gap-2 rounded-[24px] bg-bg-subtle p-6">
              <MapPin aria-hidden className="size-6" />
              <span className="font-semibold">Endereço</span>
              <span className="text-muted">{c.address}</span>
              {c.mapsUrl && <a href={c.mapsUrl} target="_blank" rel="noopener" className="mt-1 text-[15px] font-medium underline underline-offset-4">Abrir no Google Maps</a>}
            </div>
          )}
          {c.hours && (
            <div className="grid content-start gap-2 rounded-[24px] bg-bg-subtle p-6">
              <Clock aria-hidden className="size-6" />
              <span className="font-semibold">Horário</span>
              <span className="whitespace-pre-line text-muted">{c.hours}</span>
            </div>
          )}
        </div>
      </section>

      <section id="entrega" className="grid gap-6">
        <h2 className="text-title">Entrega e retirada</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {s.commerce.pickupEnabled && (
            <div className="grid content-start gap-2 rounded-[24px] bg-bg-subtle p-6">
              <h3 className="text-headline">Retirada na loja</h3>
              <p className="text-muted">{s.commerce.pickupInfo || "Combine a retirada pelo WhatsApp."}</p>
            </div>
          )}
          {s.commerce.deliveryEnabled && zones.length > 0 ? (
            <div className="rounded-[24px] bg-bg-subtle p-6">
              <h3 className="text-headline mb-1">Entrega local</h3>
              {s.commerce.deliveryInfo && <p className="mb-4 text-muted">{s.commerce.deliveryInfo}</p>}
              <table className="w-full text-left text-[15px]">
                <caption className="sr-only">Taxa de entrega por bairro</caption>
                <thead className="text-[13px] text-muted"><tr><th className="py-2 font-medium">Bairro / região</th><th className="py-2 font-medium">Prazo</th><th className="py-2 text-right font-medium">Taxa</th></tr></thead>
                <tbody>
                  {zones.map((z) => (
                    <tr key={z.id} className="border-t border-border"><td className="py-2.5">{z.name}</td><td className="py-2.5 text-muted">{z.eta || "—"}</td><td className="py-2.5 text-right">{z.fee_cents ? formatBRL(z.fee_cents) : "Sem taxa"}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !s.commerce.pickupEnabled && <p className="text-muted">Consulte a loja sobre entrega.</p>
          )}
        </div>
      </section>
    </div>
  );
}
