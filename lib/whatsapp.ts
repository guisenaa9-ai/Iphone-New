import { formatBRL } from "./money";

export const waLink = (number: string, message?: string) =>
  `https://wa.me/${number.replace(/\D/g, "")}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

export type OrderForMessage = {
  code: string;
  items: { name: string; variant: string; quantity: number; unit_price_cents: number }[];
  subtotal_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
};

export type CustomerForMessage = {
  name: string;
  fulfillment: "pickup" | "delivery";
  zoneName?: string;
  address?: string;
  notes?: string;
};

export function orderMessage(storeName: string, order: OrderForMessage, c: CustomerForMessage) {
  const lines = [
    `Olá, ${storeName}! Gostaria de finalizar o pedido *${order.code}*.`,
    "",
    ...order.items.map(
      (i) =>
        `• ${i.quantity}x ${i.name}${i.variant ? ` (${i.variant})` : ""} — ${formatBRL(i.unit_price_cents * i.quantity)}`,
    ),
    "",
    `Subtotal: ${formatBRL(order.subtotal_cents)}`,
  ];
  if (c.fulfillment === "delivery") {
    lines.push(`Entrega (${c.zoneName ?? "bairro"}): ${formatBRL(order.delivery_fee_cents)}`);
  }
  lines.push(`*Total: ${formatBRL(order.total_cents)}*`, "");
  lines.push(`Nome: ${c.name}`);
  lines.push(c.fulfillment === "pickup" ? "Retirada na loja" : `Entrega em: ${c.address ?? ""}`);
  if (c.notes) lines.push(`Observações: ${c.notes}`);
  return lines.join("\n");
}

export function productMessage(storeName: string, productName: string, variant: string, priceCents: number) {
  return `Olá, ${storeName}! Tenho interesse no ${productName}${variant ? ` (${variant})` : ""}, anunciado por ${formatBRL(priceCents)}. Podemos conversar?`;
}
