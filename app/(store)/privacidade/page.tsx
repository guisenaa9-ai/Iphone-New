import type { Metadata } from "next";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "Política de privacidade" };

// Modelo base alinhado à LGPD (Lei 13.709/2018). Cada loja deve revisar com seu jurídico.
export default async function Privacy() {
  const s = await getSettings();
  const who = s.content.legalName || s.brand.name;
  const contact = s.contact.email || s.contact.phone || "os canais de contato do site";
  return (
    <article className="container-page grid max-w-3xl gap-5 py-12 text-[16px] leading-relaxed [&_h2]:mt-6 [&_h2]:text-headline">
      <h1 className="text-title">Política de privacidade</h1>
      <p className="text-muted">Esta política explica como {who}{s.content.cnpj && `, CNPJ ${s.content.cnpj},`} trata os dados pessoais informados neste site.</p>
      <h2>Dados que coletamos</h2>
      <p>Nome, celular, e-mail (opcional), endereço de entrega e observações informados no pedido ou no formulário de avaliação de aparelho. O carrinho fica salvo apenas no seu navegador.</p>
      <h2>Para que usamos</h2>
      <p>Para registrar e entregar seu pedido, entrar em contato sobre ele, emitir documentos fiscais e responder solicitações de avaliação de troca (bases legais: execução de contrato e cumprimento de obrigação legal).</p>
      <h2>Pagamentos</h2>
      <p>Pagamentos online são processados pelo provedor de pagamento. Os dados do cartão são informados diretamente no ambiente do provedor e não passam pelos nossos servidores.</p>
      <h2>Cookies e medição</h2>
      <p>Ferramentas de medição de audiência só são carregadas se você aceitar no aviso de cookies. Você pode recusar sem prejuízo da compra.</p>
      <h2>Compartilhamento</h2>
      <p>Compartilhamos dados apenas com prestadores necessários à operação (hospedagem, pagamento, entrega) e quando exigido por lei.</p>
      <h2>Seus direitos</h2>
      <p>Você pode pedir acesso, correção, anonimização ou exclusão dos seus dados e revogar consentimentos pelo contato: {contact}.</p>
      <h2>Retenção</h2>
      <p>Mantemos os dados do pedido pelo prazo exigido pela legislação fiscal e de defesa do consumidor; depois, eles são excluídos ou anonimizados.</p>
    </article>
  );
}
