"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui/field";
import { CATEGORY_LABEL, CONDITION_LABEL, type Category, type Condition } from "@/lib/catalog";

type Facets = { categorias: Category[]; linhas: string[]; armazenamentos: string[]; cores: string[]; condicoes: Condition[] };

const FILTER_KEYS = ["categoria", "linha", "armazenamento", "cor", "condicao", "disponivel", "ofertas"] as const;

export function CatalogFilters({ facets, total }: { facets: Facets; total: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("pagina");
    start(() => router.replace(`/catalogo?${next}`, { scroll: false }));
  };
  const active = FILTER_KEYS.filter((k) => params.get(k));

  const selects: [string, string, [string, string][]][] = [
    ["categoria", "Categoria", facets.categorias.map((c) => [c, CATEGORY_LABEL[c]])],
    ["linha", "Linha", facets.linhas.map((l) => [l, l])],
    ["armazenamento", "Armazenamento", facets.armazenamentos.map((a) => [a, a])],
    ["cor", "Cor", facets.cores.map((c) => [c, c])],
    ["condicao", "Condição", facets.condicoes.map((c) => [c, CONDITION_LABEL[c]])],
  ];

  const controls = (
    <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
      {selects
        .filter(([key, , opts]) => opts.length > 1 || params.get(key))
        .map(([key, label, opts]) => (
          <label key={key} className="grid gap-1 lg:block">
            <span className="text-[13px] text-muted lg:sr-only">{label}</span>
            <Select value={params.get(key) ?? ""} onChange={(e) => set(key, e.target.value)} className="lg:h-10 lg:w-auto lg:rounded-full lg:text-[14px]">
              <option value="">{key === "categoria" ? "Todas as categorias" : `${label}: todos`}</option>
              {opts.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </label>
        ))}
      {(["disponivel", "ofertas"] as const).map((k) => (
        <label key={k} className="flex h-11 items-center gap-2 rounded-full px-1 text-[15px] lg:h-10 lg:px-4 lg:ring-1 lg:ring-border">
          <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={!!params.get(k)} onChange={(e) => set(k, e.target.checked ? "1" : "")} />
          {k === "disponivel" ? "Em estoque" : "Em oferta"}
        </label>
      ))}
    </div>
  );

  return (
    <div className="grid gap-4" aria-busy={pending}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] text-muted" aria-live="polite">
          {total} {total === 1 ? "produto" : "produtos"}
        </p>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="ordem">Ordenar</label>
          <Select id="ordem" value={params.get("ordem") ?? ""} onChange={(e) => set("ordem", e.target.value)} className="h-10 w-auto rounded-full text-[14px]">
            <option value="">Relevância</option>
            <option value="novidades">Novidades</option>
            <option value="menor-preco">Menor preço</option>
            <option value="maior-preco">Maior preço</option>
          </Select>
        </div>
      </div>
      <details className="group rounded-[20px] bg-bg-subtle p-1 lg:hidden">
        <summary className="flex h-11 items-center gap-2 px-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal aria-hidden className="size-[18px]" /> Filtros{active.length ? ` (${active.length})` : ""}
        </summary>
        <div className="p-3 pt-1">{controls}</div>
      </details>
      <div className="hidden lg:block">{controls}</div>
      {active.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {active.map((k) => (
            <button key={k} onClick={() => set(k, "")} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-fg px-3.5 text-[13px] font-medium text-bg">
              {k === "categoria" ? CATEGORY_LABEL[params.get(k) as Category] ?? params.get(k)
                : k === "condicao" ? CONDITION_LABEL[params.get(k) as Condition] ?? params.get(k)
                : k === "disponivel" ? "Em estoque" : k === "ofertas" ? "Em oferta" : params.get(k)}
              <X aria-label="remover filtro" className="size-3.5" />
            </button>
          ))}
          <button onClick={() => start(() => router.replace(params.get("q") ? `/catalogo?q=${encodeURIComponent(params.get("q")!)}` : "/catalogo", { scroll: false }))} className="h-9 rounded-full px-3 text-[13px] text-muted hover:text-fg">
            Limpar tudo
          </button>
        </div>
      )}
    </div>
  );
}
