import { Badge } from "@/components/ui/badge";

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  awaiting_payment: "Aguardando pagamento",
  paid: "Pago",
  completed: "Concluído",
  canceled: "Cancelado",
};

export function OrderStatusBadge({ status, payment }: { status: string; payment?: string }) {
  const tone = status === "paid" || status === "completed" ? "success" : status === "canceled" ? "danger" : "warning";
  return (
    <span className="inline-flex flex-wrap gap-1">
      <Badge tone={tone}>{STATUS_LABEL[status] ?? status}</Badge>
      {payment === "rejected" && <Badge tone="danger">Pagamento recusado</Badge>}
      {payment === "refunded" && <Badge tone="danger">Estornado</Badge>}
    </span>
  );
}
