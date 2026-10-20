"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, LayoutDashboard, LogOut, MapPinned, Package, Paintbrush, Repeat, ShoppingCart, Star } from "lucide-react";
import { browserClient } from "@/lib/supabase/browser";

const LINKS = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/trocas", label: "Trocas", icon: Repeat },
  { href: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { href: "/admin/entregas", label: "Entregas", icon: MapPinned },
  { href: "/admin/loja", label: "Personalizar loja", icon: Paintbrush },
];

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await browserClient().auth.signOut();
        router.replace("/admin/login");
        router.refresh();
      }}
      className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-[14px] text-muted hover:bg-bg-subtle hover:text-fg"
    >
      <LogOut aria-hidden className="size-4" /> Sair
    </button>
  );
}

export function AdminNav({ storeName, email }: { storeName: string; email: string }) {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === href : path.startsWith(href));
  return (
    <aside className="border-b border-border bg-surface lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
      <div className="flex h-16 items-center justify-between px-4 lg:h-auto lg:flex-col lg:items-stretch lg:gap-1 lg:px-5 lg:pt-7">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold tracking-[-0.01em]">{storeName}</p>
          <p className="hidden truncate text-[12px] text-muted lg:block">{email}</p>
        </div>
        <Link href="/" target="_blank" className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[14px] text-muted hover:text-fg lg:mt-2 lg:px-0">
          Ver loja <ExternalLink aria-hidden className="size-3.5" />
        </Link>
      </div>
      <nav aria-label="Painel" className="scrollbar-none overflow-x-auto px-2 pb-2 lg:mt-4 lg:px-3">
        <ul className="flex gap-1 lg:grid">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active(href) ? "page" : undefined}
                className={`flex h-10 items-center gap-2.5 rounded-[12px] px-3 text-[14px] transition-colors ${active(href) ? "bg-fg font-medium text-bg" : "text-fg/80 hover:bg-bg-subtle"}`}
              >
                <Icon aria-hidden className="size-[18px]" /> {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="px-2 pb-2 lg:absolute lg:bottom-5 lg:px-3 lg:pb-0">
        <SignOutButton />
      </div>
    </aside>
  );
}
