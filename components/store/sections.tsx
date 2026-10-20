import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/reveal";
import type { Product } from "@/lib/catalog";
import type { StoreSettings } from "@/lib/settings";
import { ProductCard } from "./product-card";

export function SectionHeader({ eyebrow, title, href, linkLabel = "Ver todos" }: { eyebrow?: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-6 sm:mb-9">
      <div className="grid gap-2">
        {eyebrow && <p className="text-eyebrow">{eyebrow}</p>}
        <h2 className="text-title">{title}</h2>
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

export function Section({ id, children, className = "" }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`container-page py-12 sm:py-16 ${className}`}>
      <Reveal>{children}</Reveal>
    </section>
  );
}

/** Grade no desktop; no celular, carrossel com rolagem nativa e encaixe. */
export function ProductShelf({
  eyebrow,
  title,
  href,
  products,
  commerce,
  id,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  products: Product[];
  commerce: StoreSettings["commerce"];
  id?: string;
}) {
  if (!products.length) return null;
  return (
    <Section id={id}>
      <SectionHeader eyebrow={eyebrow} title={title} href={href} />
      <ul className={`scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 ${products.length === 3 ? "" : "lg:grid-cols-4"}`}>
        {products.slice(0, 8).map((p) => (
          <li key={p.id} className="w-[68%] shrink-0 snap-start sm:w-auto">
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
