"use client";

import { useTransition } from "react";
import { setOrderStatus } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/** Só mostra transições que o banco aceita (admin_set_order_status). */
export function OrderActions({ id, status, channel, paymentStatus }: { id: string; status: string; channel: string; paymentStatus: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  if (status === "canceled") return null;
  const go = (s: string, msg: string, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return;
    start(async () => {
      const r = await setOrderStatus(id, s);
      toast(r.ok ? msg : (r as { error: string }).error, r.ok ? "success" : "error");
    });
  };
  const canPay = channel === "whatsapp" && status === "pending";
  const canComplete = status === "paid" || (channel === "whatsapp" && status === "pending") || (channel === "online" && paymentStatus === "approved" && status !== "completed");
  return (
    <div className="flex flex-wrap gap-2" aria-busy={pending}>
      {canPay && <Button size="sm" disabled={pending} onClick={() => go("paid", "Pedido marcado como pago")}>Marcar como pago</Button>}
      {canComplete && status !== "completed" && <Button size="sm" variant="secondary" disabled={pending} onClick={() => go("completed", "Pedido concluído")}>Concluir (entregue)</Button>}
      {status !== "completed" && (
        <Button size="sm" variant="ghost" className="text-danger" disabled={pending} onClick={() => go("canceled", "Pedido cancelado e estoque devolvido", "Cancelar este pedido? O estoque dos itens será devolvido.")}>
          Cancelar pedido
        </Button>
      )}
      {channel === "online" && status === "awaiting_payment" && <p className="self-center text-[13px] text-muted">O status muda sozinho quando o provedor confirmar o pagamento.</p>}
    </div>
  );
}
