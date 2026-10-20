"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { quoteCart } from "@/app/(store)/actions";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRL, installmentSummary } from "@/lib/money";
import type { Category } from "@/lib/catalog";
import type { StoreSettings } from "@/lib/settings";
import { useCart } from "./cart";
import { ProductMedia } from "./product-media";

export function CartView({ commerce }: { commerce: StoreSettings["commerce"] }) {
  const { lines, ready, setQty, remove, replace, subtotalCents } = useCart();
  const [notice, setNotice] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  const checked = useRef(false);

  // Confere preço e estoque reais assim que o carrinho carrega.
  useEffect(() => {
    if (!ready || checked.current || !lines.length) return;
    checked.current = true;
    quoteCart(lines.map((l) => l.variantId)).then((live) => {
      let changed = false;
      const gone = new Set<string>();
      const next = lines.map((l) => {
        const q = live[l.variantId];
        if (!q || q.stock < 1) {
          gone.add(l.variantId);
          return l;
        }
        const quantity = Math.min(l.quantity, q.stock);
        if (q.priceCents !== l.priceCents || quantity !== l.quantity || q.stock !== l.stock) changed = true;
        return { ...l, priceCents: q.priceCents, stock: q.stock, quantity };
      });
      setUnavailable(gone);
      if (changed) {
        replace(next);
        setNotice("Atualizamos preços ou quantidades conforme o estoque atual.");
      }
    });
  }, [ready, lines, replace]);

  if (!ready) {
    return (
      <div className="grid gap-4" role="status" aria-label="Carregando carrinho">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }
  if (!lines.length) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Seu carrinho está vazio"
        text="Explore o catálogo e escolha o modelo ideal para você."
        action={<ButtonLink href="/catalogo">Explorar produtos</ButtonLink>}
      />
    );
  }

  const blocked = lines.some((l) => unavailable.has(l.variantId));
  const inst = installmentSummary(subtotalCents, commerce);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div>
        {notice && <p role="status" className="mb-4 rounded-[14px] bg-warning/10 px-4 py-3 text-[14px] text-warning">{notice}</p>}
        <ul className="divide-y divide-border border-y border-border">
          {lines.map((l) => {
            const off = unavailable.has(l.variantId);
            return (
              <li key={l.variantId} className="flex gap-4 py-5 sm:gap-6">
                <Link href={`/produto/${l.slug}?v=${l.variantId}`} className="relative size-24 shrink-0 overflow-hidden rounded-[18px] bg-bg-subtle sm:size-28">
                  <span className="absolute inset-2.5">
                    <ProductMedia src={l.image} alt={l.name} category={l.category as Category} color={l.colorHex} name={l.name} sizes="112px" />
                  </span>
                </Link>
                <div className="grid min-w-0 flex-1 content-between gap-3">
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0">
                      <Link href={`/produto/${l.slug}?v=${l.variantId}`} className="text-[16px] font-semibold hover:underline">{l.name}</Link>
                      {l.variant && <p className="text-[14px] text-muted">{l.variant}</p>}
                      {off && <p className="mt-1 text-[14px] font-medium text-danger">Indisponível — remova para continuar</p>}
                    </div>
                    <p className="shrink-0 text-[16px] font-semibold">{formatBRL(l.priceCents * l.quantity)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full ring-1 ring-border" role="group" aria-label={`Quantidade de ${l.name}`}>
                      <button onClick={() => setQty(l.variantId, l.quantity - 1)} disabled={l.quantity <= 1 || off} className="grid size-11 place-items-center rounded-full disabled:opacity-30" aria-label="Diminuir">
                        <Minus aria-hidden className="size-4" />
                      </button>
                      <span className="w-7 text-center text-[15px] tabular-nums" aria-live="polite">{l.quantity}</span>
                      <button onClick={() => setQty(l.variantId, l.quantity + 1)} disabled={l.quantity >= Math.min(l.stock, 10) || off} className="grid size-11 place-items-center rounded-full disabled:opacity-30" aria-label="Aumentar">
                        <Plus aria-hidden className="size-4" />
                      </button>
                    </div>
                    <button onClick={() => remove(l.variantId)} className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[14px] text-muted hover:text-danger">
                      <Trash2 aria-hidden className="size-4" /> Remover
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <aside className="h-fit rounded-[24px] bg-bg-subtle p-6 lg:sticky lg:top-24" aria-label="Resumo">
        <h2 className="text-headline mb-5">Resumo</h2>
        <dl className="grid gap-3 text-[15px]">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatBRL(subtotalCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Entrega</dt><dd className="text-muted">calculada na próxima etapa</dd></div>
          <div className="mt-2 flex justify-between border-t border-border pt-4 text-[18px] font-semibold"><dt>Total</dt><dd>{formatBRL(subtotalCents)}</dd></div>
        </dl>
        {inst && <p className="mt-1 text-right text-[13px] text-muted">{inst}</p>}
        <Link href={blocked ? "#" : "/checkout"} aria-disabled={blocked} onClick={(e) => blocked && e.preventDefault()} className={buttonClass("primary", "lg", `mt-6 w-full ${blocked ? "pointer-events-none opacity-45" : ""}`)}>
          Continuar
        </Link>
        <Link href="/catalogo" className="mt-3 block text-center text-[14px] text-muted hover:text-fg">Continuar comprando</Link>
      </aside>
    </div>
  );
}
