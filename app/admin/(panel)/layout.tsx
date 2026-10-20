import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { AdminNav, SignOutButton } from "@/components/admin/nav";
import { requireAdmin } from "@/lib/admin";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: { default: "Painel", template: "%s · Painel" }, robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const [{ user, isAdmin }, s] = await Promise.all([requireAdmin(), getSettings()]);
  if (!isAdmin) {
    return (
      <main className="grid min-h-dvh place-items-center px-4 text-center">
        <div className="grid max-w-sm justify-items-center gap-3">
          <ShieldAlert aria-hidden className="size-10 text-warning" />
          <h1 className="text-headline">Sem acesso ao painel</h1>
          <p className="text-[15px] text-muted">A conta {user.email} não está cadastrada como administradora desta loja.</p>
          <SignOutButton />
        </div>
      </main>
    );
  }
  return (
    <div className="min-h-dvh bg-bg-subtle lg:grid lg:grid-cols-[248px_1fr]">
      <AdminNav storeName={s.brand.name} email={user.email ?? ""} />
      <main id="conteudo" className="min-w-0 px-4 pb-24 pt-6 sm:px-8 lg:py-10">{children}</main>
    </div>
  );
}
