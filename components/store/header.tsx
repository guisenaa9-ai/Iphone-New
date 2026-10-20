"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, MessageCircle, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "./cart";
import { SearchDialog, type SearchItem } from "./search";
import { waLink } from "@/lib/whatsapp";

export type NavLink = { href: string; label: string };

export function Logo({ name, logoUrl, logoDarkUrl, logoWithName }: { name: string; logoUrl: string; logoDarkUrl: string; logoWithName: boolean }) {
  const text = <span className="text-[17px] font-semibold tracking-[-0.02em]">{name}</span>;
  if (!logoUrl) return text;
  const alt = logoWithName ? "" : name; // com o nome ao lado, a imagem é decorativa
  return (
    <span className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} alt={alt} className={`h-7 w-auto ${logoWithName ? "rounded-full" : ""} ${logoDarkUrl ? "dark-hide" : ""}`} />
      {logoDarkUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoDarkUrl} alt={alt} className={`dark-show h-7 w-auto ${logoWithName ? "rounded-full" : ""}`} />
      )}
      {logoWithName && text}
    </span>
  );
}

export function Header({
  brand,
  nav,
  whatsapp,
  searchItems,
}: {
  brand: { name: string; logoUrl: string; logoDarkUrl: string; logoWithName: boolean };
  nav: NavLink[];
  whatsapp: string;
  searchItems: SearchItem[];
}) {
  const { count, ready } = useCart();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.documentElement.style.overflow = menu ? "hidden" : "";
  }, [menu]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch(true);
      }
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const iconBtn = "grid size-11 place-items-center rounded-full text-fg transition-colors duration-200 hover:bg-bg-subtle";

  return (
    <>
      <header
        className={`theme-dark sticky top-0 z-40 text-fg transition-[background-color,box-shadow] duration-300 ${scrolled && !menu ? "glass shadow-[0_1px_0_var(--border)]" : "bg-bg"}`}
      >
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-bg">
          Ir para o conteúdo
        </a>
        <div className="container-page flex h-16 items-center gap-2">
          <button className={`${iconBtn} -ml-2.5 lg:hidden`} onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-controls="menu-mobile" aria-label={menu ? "Fechar menu" : "Abrir menu"}>
            {menu ? <X aria-hidden className="size-[22px]" /> : <Menu aria-hidden className="size-[22px]" />}
          </button>
          <Link href="/" className="flex items-center rounded-lg max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2" aria-label={`${brand.name} — página inicial`}>
            <Logo {...brand} />
          </Link>
          <nav aria-label="Principal" className="ml-8 hidden lg:block">
            <ul className="flex items-center gap-1">
              {nav.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="rounded-full px-3.5 py-2 text-[14px] text-fg/80 transition-colors duration-200 hover:bg-bg-subtle hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <button className={`${iconBtn} lg:flex lg:w-auto lg:gap-2 lg:px-3.5 lg:ring-1 lg:ring-border`} onClick={() => setSearch(true)} aria-label="Buscar produtos">
              <Search aria-hidden className="size-5" />
              <span className="hidden text-[14px] text-muted lg:inline">Buscar</span>
              <kbd className="ml-3 hidden rounded-md bg-bg-subtle px-1.5 font-sans text-[11px] text-muted xl:inline">⌘K</kbd>
            </button>
            {whatsapp && (
              <a href={waLink(whatsapp)} target="_blank" rel="noopener" className={`${iconBtn} max-sm:hidden`} aria-label="Falar no WhatsApp">
                <MessageCircle aria-hidden className="size-5" />
              </a>
            )}
            <Link href="/carrinho" className={`${iconBtn} relative -mr-2.5`} aria-label={`Carrinho${ready && count ? `, ${count} ${count === 1 ? "item" : "itens"}` : ""}`}>
              <ShoppingBag aria-hidden className="size-5" />
              {ready && count > 0 && (
                <span className="absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[11px] font-semibold text-accent-fg [animation:fade-in_.3s]">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
        {menu && (
          // Ancorado no cabeçalho (sticky), abre logo abaixo dele mesmo com a faixa de aviso visível; fundo opaco.
          <div id="menu-mobile" className="absolute inset-x-0 top-full h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-bg lg:hidden [animation:fade-in_.25s_var(--ease)]">
            <nav aria-label="Menu" className="container-page grid min-h-full content-between gap-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-6">
              <div className="grid gap-3">
                <p className="text-eyebrow">Explorar a loja</p>
                <ul className="grid">
                  {nav.map((l, i) => (
                    <li key={l.href} style={{ animation: `sheet-in .45s var(--ease) ${i * 40}ms both` }}>
                      <Link
                        href={l.href}
                        aria-current={pathname === l.href.split("?")[0] ? "page" : undefined}
                        className="group flex h-16 items-center justify-between border-b border-border text-[26px] font-semibold tracking-[-0.025em] aria-[current=page]:text-accent"
                      >
                        {l.label}
                        <ChevronRight aria-hidden className="size-5 text-muted transition-transform duration-300 group-active:translate-x-1" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              {whatsapp && (
                <div className="grid gap-3 rounded-[24px] bg-bg-subtle p-5" style={{ animation: `sheet-in .45s var(--ease) ${nav.length * 40}ms both` }}>
                  <p className="text-[15px] text-muted">Dúvidas sobre algum modelo? Fale com a equipe.</p>
                  <a href={waLink(whatsapp)} target="_blank" rel="noopener" className="flex h-13 items-center justify-center gap-2 rounded-full bg-accent text-[16px] font-medium text-accent-fg">
                    <MessageCircle aria-hidden className="size-5" /> Falar no WhatsApp
                  </a>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
      <SearchDialog open={search} onClose={() => setSearch(false)} items={searchItems} />
    </>
  );
}
