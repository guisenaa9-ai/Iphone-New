"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatBRL } from "@/lib/money";
import type { Category } from "@/lib/catalog";
import { DeviceArt } from "./device-art";

export type SearchItem = { slug: string; name: string; keywords: string; priceCents: number; category: Category; colorHex: string | null; image: string | null };

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Busca instantânea no catálogo já carregado; Enter abre o catálogo com o termo. */
export function SearchDialog({ open, onClose, items }: { open: boolean; onClose: () => void; items: SearchItem[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      requestAnimationFrame(() => input.current?.focus());
    }
    if (!open && d.open) d.close();
  }, [open]);

  const results = useMemo(() => {
    const words = fold(q).split(/\s+/).filter(Boolean);
    if (!words.length) return items.slice(0, 4);
    return items.filter((i) => words.every((w) => fold(`${i.name} ${i.keywords}`).includes(w))).slice(0, 6);
  }, [q, items]);

  useEffect(() => setActive(0), [q]);

  const go = (href: string) => {
    onClose();
    setQ("");
    router.push(href);
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label="Buscar produtos"
      className="mx-auto mb-auto mt-[max(0.75rem,env(safe-area-inset-top))] w-[calc(100%-1.5rem)] max-w-2xl rounded-[24px] bg-surface p-0 text-fg shadow-pop ring-1 ring-border sm:mt-24"
    >
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const hit = results[active];
          go(q.trim() && !hit ? `/catalogo?q=${encodeURIComponent(q.trim())}` : hit ? `/produto/${hit.slug}` : "/catalogo");
        }}
        className="flex items-center gap-3 border-b border-border px-5"
      >
        <Search aria-hidden className="size-5 shrink-0 text-muted" />
        <input
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(a + 1, results.length - 1)));
            if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)));
          }}
          placeholder="Buscar modelo, cor ou capacidade"
          aria-label="Termo de busca"
          role="combobox"
          aria-expanded="true"
          aria-controls="search-results"
          aria-activedescendant={results[active] ? `sr-${results[active].slug}` : undefined}
          className="h-16 w-full bg-transparent text-[17px] outline-none placeholder:text-muted"
          enterKeyHint="search"
          autoComplete="off"
        />
        <button type="button" onClick={onClose} className="rounded-full px-2 py-1 text-[14px] text-muted hover:text-fg">
          Fechar
        </button>
      </form>
      <div className="p-2">
        <p className="px-3 pb-1 pt-2 text-eyebrow">{q ? `${results.length ? "Resultados" : "Nenhum produto encontrado"}` : "Sugestões"}</p>
        <ul id="search-results" role="listbox" aria-label="Resultados">
          {results.map((r, i) => (
            <li key={r.slug} id={`sr-${r.slug}`} role="option" aria-selected={i === active}>
              <Link
                href={`/produto/${r.slug}`}
                onClick={(e) => (e.preventDefault(), go(`/produto/${r.slug}`))}
                onMouseEnter={() => setActive(i)}
                className={`flex items-center gap-4 rounded-[16px] px-3 py-2.5 transition-colors ${i === active ? "bg-bg-subtle" : ""}`}
              >
                <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-[12px] bg-bg-subtle">
                  {r.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt="" className="size-full object-contain" />
                  ) : (
                    <DeviceArt category={r.category} color={r.colorHex} name={r.name} className="h-10 w-auto" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{r.name}</span>
                  <span className="text-[13px] text-muted">a partir de {formatBRL(r.priceCents)}</span>
                </span>
                <ArrowRight aria-hidden className="size-4 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
        {q.trim() && (
          <button type="button" onClick={() => go(`/catalogo?q=${encodeURIComponent(q.trim())}`)} className="mt-1 w-full rounded-[16px] px-3 py-3 text-left text-[15px] text-muted hover:bg-bg-subtle hover:text-fg">
            Ver todos os resultados para “{q.trim()}”
          </button>
        )}
      </div>
    </dialog>
  );
}
