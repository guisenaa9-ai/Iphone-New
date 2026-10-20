"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteProduct, setProductActive } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

export function ProductRowActions({ id, name, active }: { id: string; name: string; active: boolean }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const r = await fn();
      toast(r.ok ? msg : (r as { error: string }).error, r.ok ? "success" : "error");
    });
  return (
    <div className="flex justify-end gap-1 text-[13px]" aria-busy={pending}>
      <Link href={`/admin/produtos/${id}`} className="rounded-full px-3 py-1.5 ring-1 ring-border hover:ring-border-strong">Editar</Link>
      <button disabled={pending} onClick={() => run(() => setProductActive(id, !active), active ? "Produto desativado" : "Produto ativado")} className="rounded-full px-3 py-1.5 ring-1 ring-border hover:ring-border-strong">
        {active ? "Desativar" : "Ativar"}
      </button>
      <button
        disabled={pending}
        onClick={() => confirm(`Excluir “${name}”? Esta ação não pode ser desfeita. Pedidos antigos continuam registrados.`) && run(() => deleteProduct(id), "Produto excluído")}
        className="rounded-full px-3 py-1.5 text-danger ring-1 ring-border hover:ring-danger"
      >
        Excluir
      </button>
    </div>
  );
}
