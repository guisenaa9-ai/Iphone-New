"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CONDITION_LABEL, cheapest, colorsOf, inStock, variantImages, type Product } from "@/lib/catalog";
import type { StoreSettings } from "@/lib/settings";
import { optionsFor } from "@/lib/variants";
import { Price } from "./price";
import { ProductMedia } from "./product-media";

export function ProductCard({ product, commerce, priority = false }: { product: Product; commerce: StoreSettings["commerce"]; priority?: boolean }) {
  const [quick, setQuick] = useState(false);
  const min = cheapest(product);
  const colors = colorsOf(product);
  const [hover, setHover] = useState<string | null>(null);
  const shown = hover ? product.variants.find((v) => v.color_name === hover) ?? min : min;
  const img = variantImages(product, shown)[0];
  const available = inStock(product);
  const priced = new Set(product.variants.map((v) => v.price_cents)).size > 1;
  const used = product.variants.every((v) => v.condition !== "novo") ? CONDITION_LABEL[min.condition] : null;

  return (
    <article className="group relative grid content-start gap-4">
      <div className="relative overflow-hidden rounded-[24px] bg-bg-subtle transition-shadow duration-500 ease-premium group-hover:shadow-card">
        <Link href={`/produto/${product.slug}`} className="block aspect-[4/5]" aria-label={product.name}>
          <span className="absolute inset-[12%] transition-transform duration-700 ease-premium group-hover:scale-[1.04]">
            <ProductMedia src={img} alt={product.name} category={product.category} color={shown.color_hex} name={product.name} priority={priority} />
          </span>
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.is_launch && <Badge tone="inverse">Lançamento</Badge>}
          {product.variants.some((v) => v.compare_at_cents) && <Badge tone="accent">Oferta</Badge>}
          {used && <Badge>{used}</Badge>}
          {!available && <Badge tone="danger">Esgotado</Badge>}
        </div>
        <button
          type="button"
          onClick={() => setQuick(true)}
          className="glass absolute bottom-3 right-3 z-10 grid size-11 place-items-center rounded-full opacity-100 ring-1 ring-border transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          aria-label={`Visualização rápida de ${product.name}`}
        >
          <Eye aria-hidden className="size-[18px]" />
        </button>
      </div>
      <div className="grid gap-2 px-1">
        {colors.length > 1 && (
          <ul className="flex gap-1.5" aria-label={`${colors.length} cores`}>
            {colors.slice(0, 6).map((c) => (
              <li key={c.name}>
                <span
                  onMouseEnter={() => setHover(c.name)}
                  onMouseLeave={() => setHover(null)}
                  title={c.name}
                  className="block size-3.5 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.15)]"
                  style={{ background: c.hex ?? "#999" }}
                />
              </li>
            ))}
          </ul>
        )}
        <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.01em]">
          <Link href={`/produto/${product.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <Price cents={min.price_cents} compareAt={priced ? null : min.compare_at_cents} commerce={commerce} from={priced} />
      </div>

      <Dialog open={quick} onClose={() => setQuick(false)} title={product.name} wide>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="relative aspect-square rounded-[20px] bg-bg-subtle">
            <span className="absolute inset-[10%]">
              <ProductMedia src={variantImages(product, min)[0]} alt={product.name} category={product.category} color={min.color_hex} name={product.name} sizes="(min-width: 640px) 400px, 100vw" />
            </span>
          </div>
          <div className="grid content-start gap-5">
            <Price cents={min.price_cents} compareAt={priced ? null : min.compare_at_cents} commerce={commerce} from={priced} size="lg" />
            {product.description && <p className="text-[15px] leading-relaxed text-muted">{product.description}</p>}
            <dl className="grid gap-2 text-[14px]">
              {(["storage", "color_name", "condition"] as const).map((a) => {
                const vals = optionsFor(product.variants, a);
                if (!vals.length) return null;
                return (
                  <div key={a} className="flex gap-3">
                    <dt className="w-32 shrink-0 text-muted">{a === "storage" ? "Armazenamento" : a === "color_name" ? "Cores" : "Condição"}</dt>
                    <dd>{vals.map((v) => (a === "condition" ? CONDITION_LABEL[v as keyof typeof CONDITION_LABEL] : v)).join(", ")}</dd>
                  </div>
                );
              })}
            </dl>
            <ButtonLink href={`/produto/${product.slug}`} size="lg">
              Escolher opções
            </ButtonLink>
          </div>
        </div>
      </Dialog>
    </article>
  );
}
