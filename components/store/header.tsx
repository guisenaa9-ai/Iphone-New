"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageCircle, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "./cart";
import { SearchDialog, type SearchItem } from "./search";
import { waLink } from "@/lib/whatsapp";

export type NavLink = { href: string; label: string };

export function Logo({ name, logoUrl, logoDarkUrl }: { name: string; logoUrl: string; logoDarkUrl: string }) {
  if (!logoUrl) return <span className="text-[17px] font-semibold tracking-[-0.02em]">{name}</span>;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} alt={name} className={`h-7 w-auto ${logoDarkUrl ? "dark-hide" : ""}`} />
      {logoDarkUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoDarkUrl} alt={name} className="dark-show h-7 w-auto" />
      )}
    </>
  );
}

export function Header({
  brand,
  nav,
  whatsapp,
  searchItems,
}: {
  brand: { name: string; logoUrl: string; logoDarkUrl: string };
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
        className={`sticky top-0 z-40 transition-[background-color,box-shadow] duration-300 ${scrolled || menu ? "glass shadow-[0_1px_0_var(--border)]" : "bg-bg"}`}
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
          <div id="menu-mobile" className="glass fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto lg:hidden [animation:fade-in_.25s_var(--ease)]">
            <nav aria-label="Menu" className="container-page pb-10 pt-4">
              <ul className="grid">
                {nav.map((l, i) => (
                  <li key={l.href} style={{ animation: `sheet-in .45s var(--ease) ${i * 40}ms both` }}>
                    <Link href={l.href} className="flex h-14 items-center border-b border-border text-[22px] font-semibold tracking-[-0.02em]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {whatsapp && (
                <a href={waLink(whatsapp)} target="_blank" rel="noopener" className="mt-8 flex h-13 items-center justify-center gap-2 rounded-full bg-fg text-[16px] font-medium text-bg">
                  <MessageCircle aria-hidden className="size-5" /> Falar no WhatsApp
                </a>
              )}
            </nav>
          </div>
        )}
      </header>
      <SearchDialog open={search} onClose={() => setSearch(false)} items={searchItems} />
    </>
  );
}
