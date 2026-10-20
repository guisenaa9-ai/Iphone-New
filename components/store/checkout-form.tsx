"use client";

import Link from "next/link";
import { CreditCard, Loader2, MapPin, MessageCircle, ShoppingBag, Store, Truck } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { placeOrder } from "@/app/(store)/actions";
import { ButtonLink, Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRL } from "@/lib/money";
import type { StoreSettings } from "@/lib/settings";
import { useCart } from "./cart";

type Zone = { id: string; name: string; fee_cents: number; eta: string };

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
};

export function CheckoutForm({
  storeName,
  commerce,
  zones,
  address,
  mapsUrl,
  channels,
}: {
  storeName: string;
  commerce: StoreSettings["commerce"];
  zones: Zone[];
  address: string;
  mapsUrl: string;
  channels: { whatsapp: boolean; online: boolean };
}) {
  const { lines, ready, subtotalCents, clear } = useCart();
  const canDeliver = commerce.deliveryEnabled && zones.length > 0;
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">(commerce.pickupEnabled || !canDeliver ? "pickup" : "delivery");
  const [zoneId, setZoneId] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ code: string; url: string } | null>(null);
  const [pending, start] = useTransition();

  if (!ready) return <Skeleton className="h-96 w-full" />;
  if (done) {
    return (
      <EmptyState
        icon={MessageCircle}
        title={`Pedido ${done.code} registrado`}
        text="Abrimos o WhatsApp com o resumo do pedido. Se ele não abriu, use o botão abaixo para enviar a mensagem à loja."
        action={
          <a href={done.url} target="_blank" rel="noopener" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1f9d55] px-5 font-medium text-white">
            <MessageCircle aria-hidden className="size-5" /> Enviar no WhatsApp
          </a>
        }
      />
    );
  }
  if (!lines.length) {
    return <EmptyState icon={ShoppingBag} title="Seu carrinho está vazio" action={<ButtonLink href="/catalogo">Explorar produtos</ButtonLink>} />;
  }
  if (!channels.whatsapp && !channels.online) {
    return <EmptyState icon={Store} title="Finalização indisponível" text={`A loja ainda não configurou a finalização de pedidos. Fale com a ${storeName} pelos contatos do rodapé.`} />;
  }

  const zone = zones.find((z) => z.id === zoneId);
  const fee = fulfillment === "delivery" ? zone?.fee_cents ?? 0 : 0;

  const submit = (channel: "whatsapp" | "online") => (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const form = document.getElementById("checkout") as HTMLFormElement;
    if (!form.reportValidity()) return;
    const f = new FormData(form);
    setError(null);
    // Abre a aba já no clique: navegadores bloqueiam janelas abertas depois de uma espera.
    const tab = channel === "whatsapp" ? window.open("about:blank", "_blank") : null;
    if (tab) tab.opener = null;
    start(async () => {
      const res = await placeOrder({
        channel,
        fulfillment,
        zone_id: fulfillment === "delivery" ? zoneId : undefined,
        address: fulfillment === "delivery" ? String(f.get("address") ?? "") : undefined,
        notes: String(f.get("notes") ?? "") || undefined,
        customer: { name: String(f.get("name") ?? ""), phone, email: String(f.get("email") ?? "") },
        items: lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
        privacy: f.get("privacy") === "on",
      });
      if (!res.ok) {
        tab?.close();
        setError(res.error);
        return;
      }
      clear();
      if (res.channel === "online") {
        window.location.href = res.redirectUrl;
        return;
      }
      if (tab) tab.location.href = res.whatsappUrl;
      else window.location.href = res.whatsappUrl;
      setDone({ code: res.code, url: res.whatsappUrl });
    });
  };

  const option = (active: boolean) =>
    `flex min-h-16 items-center gap-3 rounded-[16px] p-4 text-left ring-1 transition-[box-shadow] ${active ? "ring-2 ring-fg" : "ring-border hover:ring-border-strong"}`;

  return (
    <form id="checkout" onSubmit={submit(channels.whatsapp ? "whatsapp" : "online")} className="grid gap-10 lg:grid-cols-[1fr_380px]" noValidate={false}>
      <div className="grid content-start gap-10">
        <fieldset className="grid gap-4">
          <legend className="text-headline mb-4">Seus dados</legend>
          <Field label="Nome completo" htmlFor="name">
            <Input id="name" name="name" required minLength={2} maxLength={80} autoComplete="name" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Celular (WhatsApp)" htmlFor="phone">
              <Input id="phone" name="phone" required inputMode="tel" autoComplete="tel-national" placeholder="(92) 99999-9999" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} pattern="\(\d{2}\) \d{4,5}-\d{4}" title="Celular com DDD" />
            </Field>
            <Field label="E-mail (opcional)" htmlFor="email">
              <Input id="email" name="email" type="email" autoComplete="email" maxLength={120} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="text-headline mb-4">Como você quer receber?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {commerce.pickupEnabled && (
              <button type="button" onClick={() => setFulfillment("pickup")} aria-pressed={fulfillment === "pickup"} className={option(fulfillment === "pickup")}>
                <Store aria-hidden className="size-5 shrink-0" />
                <span>
                  <span className="block font-semibold">Retirar na loja</span>
                  <span className="text-[13px] text-muted">{commerce.pickupInfo || "Sem custo de entrega"}</span>
                </span>
              </button>
            )}
            {canDeliver && (
              <button type="button" onClick={() => setFulfillment("delivery")} aria-pressed={fulfillment === "delivery"} className={option(fulfillment === "delivery")}>
                <Truck aria-hidden className="size-5 shrink-0" />
                <span>
                  <span className="block font-semibold">Entrega</span>
                  <span className="text-[13px] text-muted">{commerce.deliveryInfo || "Taxa conforme o bairro"}</span>
                </span>
              </button>
            )}
          </div>
          {fulfillment === "pickup" && address && (
            <p className="flex items-start gap-2 text-[14px] text-muted">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
              {mapsUrl ? <a href={mapsUrl} target="_blank" rel="noopener" className="underline underline-offset-2">{address}</a> : address}
            </p>
          )}
          {fulfillment === "delivery" && (
            <div className="grid gap-4">
              <Field label="Bairro" htmlFor="zone" hint={zone?.eta || undefined}>
                <Select id="zone" required value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                  <option value="">Selecione o bairro</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} — {z.fee_cents ? formatBRL(z.fee_cents) : "sem taxa"}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Endereço completo" htmlFor="address">
                <Input id="address" name="address" required minLength={5} maxLength={300} autoComplete="street-address" placeholder="Rua, número, complemento e referência" />
              </Field>
            </div>
          )}
          <Field label="Observações (opcional)" htmlFor="notes">
            <Textarea id="notes" name="notes" maxLength={500} placeholder="Ex.: melhor horário para contato" />
          </Field>
        </fieldset>

        <label className="flex items-start gap-3 text-[14px] text-muted">
          <input type="checkbox" name="privacy" required className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
          <span>
            Concordo com o uso dos meus dados para processar este pedido, conforme a{" "}
            <Link href="/privacidade" target="_blank" className="underline">política de privacidade</Link> e os{" "}
            <Link href="/termos" target="_blank" className="underline">termos</Link>.
          </span>
        </label>
      </div>

      <aside className="h-fit rounded-[24px] bg-bg-subtle p-6 lg:sticky lg:top-24" aria-label="Resumo do pedido">
        <h2 className="text-headline mb-4">Resumo</h2>
        <ul className="grid gap-3 border-b border-border pb-4 text-[14px]">
          {lines.map((l) => (
            <li key={l.variantId} className="flex justify-between gap-3">
              <span className="min-w-0">
                {l.quantity}x {l.name}
                {l.variant && <span className="block text-muted">{l.variant}</span>}
              </span>
              <span className="shrink-0">{formatBRL(l.priceCents * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="grid gap-2 pt-4 text-[15px]">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatBRL(subtotalCents)}</dd></div>
          <div className="flex justify-between">
            <dt className="text-muted">Entrega</dt>
            <dd>{fulfillment === "pickup" ? "Retirada" : zone ? (fee ? formatBRL(fee) : "sem taxa") : "—"}</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-4 text-[18px] font-semibold"><dt>Total</dt><dd>{formatBRL(subtotalCents + fee)}</dd></div>
        </dl>
        <p className="mt-2 text-[12px] text-muted">Valores confirmados pela loja no fechamento, com base no estoque e preço atuais.</p>
        {error && <p role="alert" className="mt-4 rounded-[12px] bg-danger/10 px-4 py-3 text-[14px] text-danger">{error}</p>}
        <div className="mt-5 grid gap-3">
          {channels.online && (
            <Button size="lg" type={channels.whatsapp ? "button" : "submit"} onClick={channels.whatsapp ? () => submit("online")() : undefined} disabled={pending}>
              {pending ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <CreditCard aria-hidden className="size-5" />} Pagar online (Pix ou cartão)
            </Button>
          )}
          {channels.whatsapp && (
            <Button size="lg" type="submit" variant={channels.online ? "secondary" : "primary"} disabled={pending}>
              {pending ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <MessageCircle aria-hidden className="size-5" />} Finalizar pelo WhatsApp
            </Button>
          )}
        </div>
        {commerce.paymentInfo && <p className="mt-3 text-[13px] text-muted">{commerce.paymentInfo}</p>}
      </aside>
    </form>
  );
}
