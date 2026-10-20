"use client";

import { BatteryMedium, Check, MessageCircle, ShieldCheck, ShoppingBag, Store, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CONDITION_LABEL, variantImages, variantLabel, type Product } from "@/lib/catalog";
import { formatBRL, installmentOptions } from "@/lib/money";
import type { StoreSettings } from "@/lib/settings";
import { AXES, defaultVariant, isOptionAvailable, optionsFor, pickVariant, selectionOf, type Axis } from "@/lib/variants";
import { productMessage, waLink } from "@/lib/whatsapp";
import { useCart } from "./cart";
import { Gallery } from "./gallery";

const AXIS_LABEL: Record<Axis, string> = { storage: "Armazenamento", color_name: "Cor", condition: "Condição" };

export function ProductBuy({
  product,
  commerce,
  storeName,
  whatsapp,
  initialVariantId,
  zonesCount,
}: {
  product: Product;
  commerce: StoreSettings["commerce"];
  storeName: string;
  whatsapp: string;
  initialVariantId?: string | null;
  zonesCount: number;
}) {
  const [variant, setVariant] = useState(() => defaultVariant(product.variants, initialVariantId));
  const { add } = useCart();
  const toast = useToast();
  const sel = selectionOf(variant);
  const images = variantImages(product, variant);
  const options = useMemo(() => AXES.map((a) => [a, optionsFor(product.variants, a)] as const).filter(([a, o]) => (a === "condition" ? o.length > 1 : o.length > 0)), [product.variants]);
  const installments = installmentOptions(variant.price_cents, commerce);
  const lowStock = variant.stock > 0 && variant.stock <= commerce.lowStockThreshold;
  const label = variantLabel(variant);

  // Link compartilhável da variante escolhida, sem recarregar a página.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("v", variant.id);
    window.history.replaceState(null, "", url);
  }, [variant.id]);

  const addToCart = () => {
    add({
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      variant: label,
      category: product.category,
      colorHex: variant.color_hex,
      image: images[0] ?? null,
      priceCents: variant.price_cents,
      stock: variant.stock,
    });
    toast(`${product.name} adicionado ao carrinho`);
  };

  const wa = whatsapp ? waLink(whatsapp, productMessage(storeName, product.name, label, variant.price_cents)) : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Gallery images={images} name={product.name} category={product.category} color={variant.color_hex} />
      </div>

      <div className="grid content-start gap-7">
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {product.is_launch && <Badge tone="inverse">Lançamento</Badge>}
            {variant.compare_at_cents && <Badge tone="accent">Oferta</Badge>}
            {variant.condition !== "novo" && <Badge>{CONDITION_LABEL[variant.condition]}</Badge>}
          </div>
          <h1 className="text-title">{product.name}</h1>
          {product.description && <p className="max-w-prose text-[17px] leading-relaxed text-muted">{product.description}</p>}
        </div>

        <div className="grid gap-1" aria-live="polite">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="text-[32px] font-semibold tracking-[-0.025em]">{formatBRL(variant.price_cents)}</span>
            {variant.compare_at_cents && <s className="text-[17px] text-muted">{formatBRL(variant.compare_at_cents)}</s>}
          </div>
          <span className="text-[14px] text-muted">
            {installments.length
              ? (() => {
                  const free = installments.filter((o) => o.interestFree).at(-1);
                  const best = free ?? installments.at(-1)!;
                  return `ou em até ${best.count}x de ${formatBRL(best.perCents)}${best.interestFree ? " sem juros" : ""} no cartão`;
                })()
              : "Preço à vista"}
          </span>
        </div>

        {options.map(([axis, values]) => (
          <fieldset key={axis} className="grid gap-3">
            <legend className="mb-3 text-[15px]">
              <span className="font-semibold">{AXIS_LABEL[axis]}</span>
              {axis === "color_name" && sel.color_name && <span className="text-muted"> · {sel.color_name}</span>}
            </legend>
            <div className={axis === "color_name" ? "flex flex-wrap gap-3" : "grid grid-cols-2 gap-2.5 sm:grid-cols-3"}>
              {values.map((value) => {
                const selected = sel[axis] === value;
                const available = isOptionAvailable(product.variants, sel, axis, value);
                const choose = () => setVariant(pickVariant(product.variants, sel, axis, value));
                if (axis === "color_name") {
                  const hex = product.variants.find((v) => v.color_name === value)?.color_hex ?? "#888888";
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={choose}
                      aria-pressed={selected}
                      aria-label={`${value}${available ? "" : " (outra combinação)"}`}
                      title={value}
                      className={`relative grid size-11 place-items-center rounded-full ring-2 ring-offset-2 ring-offset-bg transition-[box-shadow,transform] duration-200 active:scale-95 ${selected ? "ring-fg" : "ring-transparent hover:ring-border-strong"}`}
                    >
                      <span className="size-9 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12),inset_0_-6px_10px_rgb(0_0_0/0.12)]" style={{ background: hex }} />
                      {!available && <span aria-hidden className="absolute h-[2px] w-9 rotate-45 rounded bg-fg/50" />}
                    </button>
                  );
                }
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={choose}
                    aria-pressed={selected}
                    className={`min-h-13 rounded-[14px] px-3 py-2.5 text-left text-[15px] ring-1 transition-[box-shadow,background-color] duration-200 ${selected ? "bg-surface font-semibold ring-2 ring-fg" : "ring-border hover:ring-border-strong"} ${available ? "" : "text-muted"}`}
                  >
                    {axis === "condition" ? CONDITION_LABEL[value as keyof typeof CONDITION_LABEL] : value}
                    {!available && <span className="block text-[12px] font-normal">outra combinação</span>}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div className="grid gap-2.5 rounded-[20px] bg-bg-subtle p-5 text-[15px]">
          <p className={`flex items-center gap-2 font-medium ${variant.stock > 0 ? (lowStock ? "text-warning" : "text-success") : "text-danger"}`}>
            <span aria-hidden className="size-2 rounded-full bg-current" />
            {variant.stock > 0 ? (lowStock ? `Últimas ${variant.stock} unidades` : "Em estoque") : "Indisponível nesta combinação"}
          </p>
          {variant.condition !== "novo" && variant.battery_health && (
            <p className="flex items-center gap-2">
              <BatteryMedium aria-hidden className="size-[18px] text-muted" /> Saúde da bateria: <strong>{variant.battery_health}%</strong>
            </p>
          )}
          {product.warranty && (
            <p className="flex items-start gap-2">
              <ShieldCheck aria-hidden className="mt-0.5 size-[18px] shrink-0 text-muted" /> {product.warranty}
            </p>
          )}
          {commerce.pickupEnabled && (
            <p className="flex items-start gap-2">
              <Store aria-hidden className="mt-0.5 size-[18px] shrink-0 text-muted" /> Retirada na loja{commerce.pickupInfo ? ` — ${commerce.pickupInfo}` : ""}
            </p>
          )}
          {commerce.deliveryEnabled && zonesCount > 0 && (
            <p className="flex items-start gap-2">
              <Truck aria-hidden className="mt-0.5 size-[18px] shrink-0 text-muted" /> Entrega local em {zonesCount} {zonesCount === 1 ? "região" : "regiões"}
              {commerce.deliveryInfo ? ` — ${commerce.deliveryInfo}` : "."}{" "}
              <Link href="/sobre#entrega" className="underline underline-offset-2">Ver taxas</Link>
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button size="lg" onClick={addToCart} disabled={variant.stock < 1}>
            <ShoppingBag aria-hidden className="size-5" />
            {variant.stock < 1 ? "Indisponível" : "Adicionar ao carrinho"}
          </Button>
          {wa && (
            <a href={wa} target="_blank" rel="noopener" className={buttonClass("secondary", "lg")}>
              <MessageCircle aria-hidden className="size-5" /> Negociar no WhatsApp
            </a>
          )}
        </div>
        {commerce.paymentInfo && <p className="-mt-3 text-[13px] text-muted">{commerce.paymentInfo}</p>}

        {installments.length > 0 && (
          <details className="group rounded-[20px] ring-1 ring-border">
            <summary className="flex min-h-13 items-center justify-between px-5 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
              Opções de parcelamento
              <span aria-hidden className="text-muted transition-transform group-open:rotate-45">+</span>
            </summary>
            <ul className="grid gap-1 px-5 pb-4 text-[14px]">
              {installments.map((o) => (
                <li key={o.count} className="flex justify-between gap-4 border-t border-border py-2 first:border-0">
                  <span>
                    {o.count}x de {formatBRL(o.perCents)}
                  </span>
                  <span className="text-muted">{o.interestFree ? "sem juros" : `total ${formatBRL(o.totalCents)}`}</span>
                </li>
              ))}
            </ul>
          </details>
        )}

        {product.specs.length > 0 && (
          <section aria-labelledby="specs" className="grid gap-3">
            <h2 id="specs" className="text-headline">Especificações</h2>
            <dl className="grid rounded-[20px] ring-1 ring-border">
              {product.specs.map((s) => (
                <div key={s.label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 border-t border-border px-5 py-3 text-[15px] first:border-0">
                  <dt className="text-muted">{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      {/* Barra fixa no celular: preço e compra sempre ao alcance do polegar. */}
      <div className="glass fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-muted">{label || product.name}</p>
          <p className="text-[17px] font-semibold">{formatBRL(variant.price_cents)}</p>
        </div>
        <Button onClick={addToCart} disabled={variant.stock < 1}>
          {variant.stock < 1 ? "Indisponível" : (
            <>
              <Check aria-hidden className="size-[18px]" /> Adicionar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
