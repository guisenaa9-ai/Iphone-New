import type { Metadata } from "next";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "Termos, trocas e devoluções" };

// Modelo base conforme o Código de Defesa do Consumidor e o Decreto 7.962/2013. Revisar por loja.
export default async function Terms() {
  const s = await getSettings();
  const who = s.content.legalName || s.brand.name;
  return (
    <article className="container-page grid max-w-3xl gap-5 py-12 text-[16px] leading-relaxed [&_h2]:mt-6 [&_h2]:text-headline">
      <h1 className="text-title">Termos, trocas e devoluções</h1>
      <p className="text-muted">
        Fornecedor: {who}
        {s.content.cnpj && ` · CNPJ ${s.content.cnpj}`}
        {s.contact.address && ` · ${s.contact.address}`}.
      </p>
      <h2>Preços e disponibilidade</h2>
      <p>Preços, estoque e condições de pagamento são definidos pela loja e confirmados no fechamento do pedido. Em caso de divergência, prevalece o valor confirmado antes do pagamento.</p>
      <h2>Garantia</h2>
      <p>Cada produto informa sua garantia na própria página. Produtos seminovos e recondicionados têm a condição e, quando aplicável, a saúde da bateria indicadas no anúncio.</p>
      <h2>Direito de arrependimento</h2>
      <p>Em compras feitas pela internet, você pode desistir em até 7 dias a partir do recebimento (art. 49 do CDC). Entre em contato pelos canais da loja para combinar a devolução.</p>
      <h2>Trocas por defeito</h2>
      <p>Produtos com defeito seguem os prazos do CDC e da garantia informada. A loja orienta o procedimento pelos canais de atendimento.</p>
      <h2>Atendimento</h2>
      <p>{[s.contact.phone, s.contact.email].filter(Boolean).join(" · ") || "Use os contatos do rodapé."}</p>
    </article>
  );
}
