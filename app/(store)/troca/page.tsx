import type { Metadata } from "next";
import { TradeInForm } from "@/components/store/trade-in-form";

export const metadata: Metadata = { title: "Avaliar meu aparelho", description: "Envie os dados do seu aparelho e receba uma proposta de troca da loja." };

export default function TradeInPage() {
  return (
    <div className="container-page grid max-w-3xl gap-8 py-10 sm:py-14">
      <div className="grid gap-3">
        <p className="text-eyebrow">Troca</p>
        <h1 className="text-title">Avalie seu aparelho usado</h1>
        <p className="text-[17px] leading-relaxed text-muted">
          Conte como está o seu aparelho. A equipe analisa e entra em contato com uma proposta. O valor depende da avaliação
          presencial — nada é calculado automaticamente.
        </p>
      </div>
      <TradeInForm />
    </div>
  );
}
