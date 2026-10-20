import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CatalogFilters } from "@/components/store/catalog-filters";
import { ProductCard } from "@/components/store/product-card";
import { CATEGORY_LABEL, facets, filterProducts, getProducts, getSettings, type CatalogQuery, type Category } from "@/lib/catalog";

const PAGE_SIZE = 12;

type Props = { searchParams: Promise<CatalogQuery & { pagina?: string }> };

function titleFor(q: CatalogQuery) {
  if (q.q) return `Resultados para “${q.q}”`;
  if (q.linha) return q.linha;
  if (q.condicao === "seminovo") return "iPhones seminovos";
  if (q.ofertas) return "Ofertas";
  if (q.categoria && q.categoria in CATEGORY_LABEL) return CATEGORY_LABEL[q.categoria as Category];
  return "Catálogo";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = await searchParams;
  return { title: titleFor(q), alternates: { canonical: "/catalogo" } };
}

export default async function Catalog({ searchParams }: Props) {
  const raw = await searchParams;
  const q = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])) as CatalogQuery & { pagina?: string };
  const [s, all] = await Promise.all([getSettings(), getProducts()]);
  const list = filterProducts(all, q);
  const page = Math.max(1, Math.min(Number(q.pagina) || 1, 50));
  const shown = list.slice(0, page * PAGE_SIZE);
  const moreParams = new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][]);
  moreParams.set("pagina", String(page + 1));

  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: titleFor(q) }]} />
      <h1 className="text-title mb-8 mt-4">{titleFor(q)}</h1>
      <Suspense>
        <CatalogFilters facets={facets(all)} total={list.length} />
      </Suspense>
      <div className="mt-8">
        {shown.length ? (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-4">
            {shown.map((p, i) => (
              <li key={p.id}>
                <ProductCard product={p} commerce={s.commerce} priority={i < 4} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={SearchX}
            title="Nenhum produto encontrado"
            text="Tente remover algum filtro ou buscar por outro modelo."
            action={<Link href="/catalogo" className={buttonClass("secondary")}>Ver todo o catálogo</Link>}
          />
        )}
        {list.length > shown.length && (
          <div className="mt-12 flex justify-center">
            <Link href={`/catalogo?${moreParams}`} scroll={false} className={buttonClass("secondary", "lg")}>
              Mostrar mais ({list.length - shown.length})
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
