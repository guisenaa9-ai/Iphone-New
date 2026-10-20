"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { waLink } from "@/lib/whatsapp";

/** Atalho de WhatsApp. Some onde já existe uma barra de compra fixa ou o checkout. */
export function WhatsAppFab({ number, storeName }: { number: string; storeName: string }) {
  const path = usePathname();
  if (!number || path.startsWith("/produto/") || path.startsWith("/checkout") || path.startsWith("/carrinho")) return null;
  return (
    <a
      href={waLink(number, `Olá, ${storeName}! Vim pelo site e gostaria de atendimento.`)}
      target="_blank"
      rel="noopener"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 grid size-14 place-items-center rounded-full bg-[#1f9d55] text-white shadow-pop transition-transform duration-300 ease-premium hover:scale-105 active:scale-95"
    >
      <MessageCircle aria-hidden className="size-6" />
    </a>
  );
}
