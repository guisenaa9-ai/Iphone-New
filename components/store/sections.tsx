import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/reveal";
import type { Product } from "@/lib/catalog";
import type { StoreSettings } from "@/lib/settings";
import { ProductCard } from "./product-card";

export function SectionHeader({ eyebrow, title, tagline, href, linkLabel = "Ver todos" }: { eyebrow?: string; title: string; tagline?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-6 sm:mb-9">
      <div className="grid gap-2">
        {eyebrow && <p className="text-eyebrow">{eyebrow}</p>}
        <h2 className="text-title">
          {title}
          {tagline && <span className="text-muted"> {tagline}</span>}
        </h2>
      </div>
      {href && (
        <Link href={href} className="group hidden shrink-0 items-center gap-1 rounded-full text-[15px] font-medium sm:inline-flex">
          {linkLabel}
          <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function Section({ id, children, className = "", tinted = false }: { id?: string; children: ReactNode; className?: string; tinted?: boolean }) {
  const inner = (
    <section id={id} className={`container-page py-12 sm:py-16 ${className}`}>
      <Reveal>{children}</Reveal>
    </section>
  );
  return tinted ? <div className="bg-bg-subtle">{inner}</div> : inner;
}

/** Carrossel de cartões sobre faixa cinza, no estilo vitrine: rolagem nativa com encaixe. */
export function ProductShelf({
  eyebrow,
  title,
  tagline,
  href,
  products,
  commerce,
  id,
}: {
  eyebrow?: string;
  title: string;
  tagline?: string;
  href?: string;
  products: Product[];
  commerce: StoreSettings["commerce"];
  id?: string;
}) {
  if (!products.length) return null;
  return (
    <Section id={id} tinted>
      <SectionHeader eyebrow={eyebrow} title={title} tagline={tagline} href={href} />
      <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-6 pt-1 sm:-mx-6 sm:scroll-px-6 sm:gap-5 sm:px-6 lg:-mx-10 lg:scroll-px-10 lg:px-10">
        {products.slice(0, 8).map((p) => (
          <li key={p.id} className="w-[78%] max-w-[340px] shrink-0 snap-start sm:w-[320px]">
            <ProductCard product={p} commerce={commerce} />
          </li>
        ))}
      </ul>
      {href && (
        <Link href={href} className="mt-6 inline-flex h-11 items-center gap-1 text-[15px] font-medium sm:hidden">
          Ver todos <ArrowRight aria-hidden className="size-4" />
        </Link>
      )}
    </Section>
  );
}
