import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "Termos de uso, trocas e devoluções" };

// Modelo base conforme o Código de Defesa do Consumidor e o Decreto 7.962/2013. Revisar por loja.
// Os prazos de reserva repetem release_expired_orders() no banco: mude os dois juntos.
const UPDATED_AT = "20 de outubro de 2026";

export default async function Terms() {
  const s = await getSettings();
  const who = s.content.legalName || s.brand.name;
  const contact = [s.contact.phone, s.contact.email].filter(Boolean).join(" · ") || "os contatos do rodapé";
  return (
    <article className="container-page grid max-w-3xl gap-5 py-12 text-[16px] leading-relaxed [&_h2]:mt-6 [&_h2]:text-headline">
      <h1 className="text-title">Termos de uso, trocas e devoluções</h1>
      <p className="text-muted">
        Fornecedor: {who}
        {s.content.cnpj && ` · CNPJ ${s.content.cnpj}`}
        {s.contact.address && ` · ${s.contact.address}`}. Última atualização: {UPDATED_AT}.
      </p>

      <h2>1. Aceitação</h2>
      <p>Ao navegar neste site ou fazer um pedido, você concorda com estes termos. Se não concordar, não utilize o site. Estes termos não afastam nenhum direito garantido pelo Código de Defesa do Consumidor (CDC).</p>

      <h2>2. Produtos</h2>
      <p>Vendemos aparelhos novos, seminovos e recondicionados. A condição de cada aparelho, a cor, a capacidade e, nos usados, a saúde da bateria aparecem no anúncio. As fotos podem ser ilustrativas: em caso de diferença, vale a descrição do anúncio.</p>

      <h2>3. Preços e pagamento</h2>
      <p>Os preços e o estoque são conferidos no momento do fechamento do pedido. Se houver diferença entre o carrinho e o valor confirmado, prevalece o valor mostrado antes do pagamento, e você pode desistir sem custo. O pagamento online (Pix ou cartão, quando disponível) é processado pelo Mercado Pago; as condições de parcelamento aparecem na página do produto e no pagamento.</p>

      <h2>4. Pedido e reserva de estoque</h2>
      <p>Ao finalizar o pedido, o estoque fica reservado para você. Pedidos com pagamento online não pago são cancelados automaticamente após 60 minutos. Pedidos finalizados pelo WhatsApp e não confirmados pela loja são cancelados após 12 horas. Nos dois casos o produto volta para a venda.</p>
      <p>Para evitar abuso, o site limita a quantidade de pedidos e solicitações por pessoa em um intervalo de tempo. Se aparecer um aviso de muitas tentativas, aguarde um pouco ou fale com a loja.</p>

      <h2>5. Entrega e retirada</h2>
      <p>Você pode retirar na loja ou receber nos bairros atendidos, com a taxa mostrada no fechamento do pedido. O prazo é combinado no atendimento. Na entrega ou retirada, confira o aparelho e a embalagem antes de assinar o recebimento.</p>

      <h2>6. Direito de arrependimento</h2>
      <p>Em compras feitas fora da loja física, você pode desistir em até 7 dias corridos a partir do recebimento, sem precisar justificar (art. 49 do CDC). Devolvemos o valor pago, incluindo a taxa de entrega, pelo mesmo meio de pagamento. O aparelho deve ser devolvido com seus acessórios e sem danos causados pelo uso indevido.</p>

      <h2>7. Garantia</h2>
      <p>Todos os produtos, inclusive seminovos e recondicionados, têm a garantia legal de 90 dias para defeitos (art. 26 do CDC). Quando o anúncio informar uma garantia da loja ou do fabricante, ela se soma à garantia legal. A garantia não cobre quedas, contato com líquidos, mau uso ou reparos feitos fora da assistência indicada.</p>

      <h2>8. Trocas por defeito</h2>
      <p>Se o produto apresentar defeito, fale com a loja. Temos até 30 dias para resolver o problema; se não for resolvido nesse prazo, você pode escolher entre a troca por outro produto igual, a devolução do valor pago ou um abatimento no preço (art. 18 do CDC).</p>

      <h2>9. Avaliação do seu aparelho na troca</h2>
      <p>O valor informado pelo formulário de troca é uma estimativa e só vale após a avaliação presencial do aparelho. Para entrar na troca, o aparelho deve ser seu, ter origem comprovada, estar sem bloqueio de iCloud e sem restrição junto à operadora. Podemos recusar aparelhos que não atendam a essas condições.</p>

      <h2>10. Uso do site</h2>
      <p>Não é permitido usar o site para fazer pedidos falsos, enviar dados de terceiros sem autorização, tentar acessar áreas restritas ou atrapalhar o funcionamento da loja. Podemos cancelar pedidos e bloquear acessos que violem estas regras. O conteúdo do site (textos, marca e fotos próprias) pertence à loja; as marcas Apple e iPhone pertencem aos seus donos.</p>

      <h2>11. Privacidade</h2>
      <p>
        O tratamento dos seus dados pessoais está descrito na{" "}
        <Link href="/privacidade" className="underline underline-offset-4">política de privacidade</Link>.
      </p>

      <h2>12. Alterações e foro</h2>
      <p>Podemos atualizar estes termos; a versão válida para o seu pedido é a publicada no dia da compra. Eventuais disputas podem ser levadas ao foro do seu domicílio (art. 101 do CDC).</p>

      <h2>13. Atendimento</h2>
      <p>Dúvidas, trocas, devoluções e reclamações: {contact}.</p>
    </article>
  );
}
