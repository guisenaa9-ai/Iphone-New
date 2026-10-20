# iStore White Label

Plataforma de loja virtual para lojas especializadas em iPhone e produtos Apple, feita para ser
vendida a várias lojas com a mesma base de código. Cada instalação tem marca, catálogo, preços,
estoque, pedidos e credenciais próprios — e tudo isso é configurado pelo painel, sem editar código.

A demonstração **NOVA iPHONE** (loja fictícia de Manaus) vem em `supabase/seed.sql`.

> Loja independente: o site não usa logotipos, imagens nem elementos visuais da Apple e informa no
> rodapé que não há vínculo com a Apple Inc. Sem fotos cadastradas, os produtos aparecem com uma
> ilustração original (SVG) na cor da variante.

## O que já funciona

**Loja (público)**
- Página inicial com hero editável, promoções sazonais com data de início e fim, linhas de iPhone,
  vitrines (destaques, lançamentos, mais vendidos a partir de vendas reais, ofertas, seminovos,
  acessórios), benefícios, convite para avaliar o usado, avaliações reais, FAQ e chamada para o WhatsApp
- Catálogo com busca, filtros (categoria, linha/geração, armazenamento, cor, condição, em estoque,
  em oferta), ordenação, visualização rápida e "Mostrar mais"; os filtros ficam na URL
- Busca instantânea (⌘K / Ctrl+K)
- Página de produto: galeria com lupa e ampliação, seleção de armazenamento × cor × condição
  (preço, estoque, imagens e link `?v=` seguem a variante escolhida), saúde da bateria em
  seminovos, garantia, parcelamento, retirada/entrega, especificações, relacionados, barra de
  compra fixa no celular e dados estruturados (schema.org Product/Offer)
- Carrinho persistente no navegador, conferido no servidor (preço e estoque atuais)
- Finalização **pelo WhatsApp** (pedido registrado com código e mensagem organizada) e/ou
  **pagamento online** (Mercado Pago: Pix e cartão), com retirada ou entrega por bairro
- Página do pedido, formulário de avaliação de aparelho para troca (sem valor automático),
  Sobre/Contato com Google Maps, Privacidade e Termos (modelos LGPD/CDC)
- Modo claro, escuro ou automático; respeita "reduzir movimento" e "reduzir transparência";
  SEO técnico (metadata, Open Graph, sitemap, robots, URLs amigáveis)

**Painel (`/admin`)**
- Login com Supabase Auth; somente usuários em `admin_users` acessam (checado no servidor e no RLS)
- Visão geral: receita paga, pedidos recebidos/pendentes/concluídos, produtos ativos, estoque baixo,
  gráfico de receita por dia (7/30/90 dias), mais vendidos e lista de reposição
- Produtos: criar, editar, ativar/desativar, excluir, fotos (upload ou URL), variantes com preço,
  preço "de" (oferta), estoque, condição, bateria e fotos próprias, especificações, destaque e lançamento
- Pedidos: filtros e busca, detalhe, contato com o cliente, marcar como pago (WhatsApp), concluir e
  cancelar (devolve estoque)
- Personalizar loja: marca, logotipos, favicon, cor (com verificação de contraste), fonte, tema,
  contato, banner principal, promoções, textos, benefícios, FAQ, regras de venda, parcelamento,
  SEO, GA4 e Meta Pixel
- Entregas (bairros, taxas e prazos), Avaliações (só reais, publicação controlada) e Trocas

## Stack e decisões

| Camada | Escolha | Por quê |
| --- | --- | --- |
| App | **Next.js 16** (App Router), React 19, TypeScript | Server Components, Server Actions e cache por tag |
| Estilo | **Tailwind CSS 4** + design tokens em CSS | A marca muda só variáveis; os componentes não mudam |
| Ícones | lucide-react | Leve e consistente |
| Validação | zod | Mesmo esquema no painel e no servidor |
| Dados | **Supabase** (Postgres, Auth, Storage) | RLS no banco, plano gratuito para começar, um projeto por loja |
| Pagamento | Mercado Pago Checkout Pro via API REST | Pix e cartão; sem SDK, poucas linhas |
| Deploy | Vercel | Domínio próprio por projeto |

Ficaram de fora de propósito:
- **shadcn/ui e Framer Motion**: os componentes necessários (botão, campos, modal com `<dialog>`
  nativo, toast, skeleton, tabelas) são poucos, e as animações são CSS com `prefers-reduced-motion`.
  Isso mantém o JavaScript menor nos celulares que chegam pelo Instagram.
- **SDK do Mercado Pago**: duas chamadas REST e a validação HMAC cabem em `lib/mercadopago.ts`.

## Como o white label funciona

```
mesmo repositório ──┬── Vercel "alpha-iphones"  ── Supabase "alpha-iphones"  (dados e chaves isolados)
                    ├── Vercel "prime-cell"     ── Supabase "prime-cell"
                    └── Vercel "concept-iphone" ── Supabase "concept-iphone"
```

- **Configuração central da marca:** `lib/settings.ts` define o esquema (zod) e padrões neutros.
  Os valores de cada loja ficam em `store_settings.data` (Postgres) e são editados em
  **/admin/loja**. Nenhum componente tem nome, telefone, cor ou condição comercial de loja escritos no código.
- **Tema:** `app/globals.css` define tokens semânticos (superfície, texto, borda) para claro e escuro;
  `app/layout.tsx` injeta só `--accent`, a cor legível sobre ela (calculada) e a fonte escolhida.
- **Isolamento:** um projeto Supabase e um projeto Vercel por cliente. Um vazamento ou erro numa loja
  não atinge as outras, e cada lojista pode ter seu próprio contrato de pagamento.
- **Rumo ao SaaS multi-tenant (quando valer a pena):** adicionar `store_id` nas tabelas e nas
  políticas RLS, resolver a loja pelo domínio no `proxy.ts` e trocar a linha única de
  `store_settings` por uma linha por loja. A estrutura atual já separa tudo por configuração.

Passo a passo de um novo cliente: **[docs/NOVA-LOJA.md](docs/NOVA-LOJA.md)**.

## Estrutura

```
app/
  (store)/            loja pública: home, catálogo, produto, carrinho, checkout, pedido, troca, sobre, legais
  (store)/actions.ts  server actions públicas (cotação do carrinho, pedido, troca)
  admin/              login e painel; admin/actions.ts = server actions do painel
  api/webhooks/mercadopago/route.ts
components/ui/        design system: Button, Field/Input/Select/Toggle, Badge, Dialog, Toast, Skeleton, Breadcrumbs, EmptyState, Reveal
components/store/     header, busca, cards, galeria, seletor de variantes, carrinho, checkout, rodapé
components/admin/     navegação, tabelas, formulários de produto e loja, gráfico
lib/                  settings (marca), catalog, variants, money, whatsapp, mercadopago, supabase/*
supabase/migrations/  schema, RLS, funções de pedido e do painel
supabase/seed.sql     loja de demonstração NOVA iPHONE
proxy.ts              protege /admin e renova a sessão
tests/                unit (vitest), integration (banco), e2e (Playwright)
```

## Rodando localmente

Requisitos: Node 20+ e um projeto Supabase (pode ser um projeto só para desenvolvimento).

```bash
npm install
cp .env.example .env.local     # preencha URL e chaves do Supabase
# aplique supabase/migrations/*.sql (CLI: npx supabase db push) e, para a demo, supabase/seed.sql
npm run dev                    # http://localhost:3000
```

Crie um usuário em **Authentication › Users** e torne-o admin:

```sql
insert into public.admin_users (user_id, role)
select id, 'owner' from auth.users where email = 'voce@exemplo.com';
```

### Banco de dados

| Arquivo | Conteúdo |
| --- | --- |
| `20261020000001_schema.sql` | tabelas: configuração, produtos, variantes, bairros, avaliações, pedidos, itens, trocas, admins |
| `20261020000002_security_and_orders.sql` | RLS em todas as tabelas, `place_order` (preço e estoque vêm do banco, com bloqueio de linha), expiração de reservas, status pelo painel, confirmação de pagamento (só `service_role`), troca, mais vendidos, bucket `store-assets` |
| `20261020000003_admin_functions.sql` | `admin_save_product` (produto + variantes numa transação) e `admin_dashboard` |
| `20261020000004_rate_limits.sql` | limites contra abuso: pedidos e trocas só pela chave de serviço, com limite por IP e por telefone; reserva de WhatsApp em 12 h |

Regras importantes:
- O navegador **nunca** define preço: `place_order` recalcula tudo a partir das variantes e trava as
  linhas (`for update`) para não vender acima do estoque.
- O estoque é reservado no pedido. Pedido online não pago libera em 60 min; pedido de WhatsApp sem
  "Marcar como pago" libera em 12 h; cancelar no painel devolve na hora.
- Pedido online só vira **Pago** pelo webhook: assinatura `x-signature` validada (HMAC-SHA256 com
  janela anti-replay), pagamento consultado na API do Mercado Pago e valor conferido com o total do pedido.
- Pedidos e trocas só entram pelo site (chave de serviço), nunca direto pela chave pública. Limites:
  5 pedidos por hora por IP (IPv6 conta o bloco /64), 2 pedidos em aberto por telefone, 3 trocas por
  hora por IP e 3 por dia por telefone. Ficam no banco para não serem contornados pela API do Supabase.
- Clientes não leem pedidos de ninguém; a página `/pedido/<uuid>` mostra só o resumo via função pública.

## Testes

```bash
npm run lint          # TypeScript
npm test              # unitários: dinheiro, parcelas, variantes, configuração, WhatsApp, assinatura do webhook
SUPABASE_TEST=1 npm run test:db   # regras do banco contra o Supabase do .env.local (ALTERA dados: use um banco de teste)
npm run test:e2e      # Playwright (desktop e celular) contra a loja rodando com o seed da demo
```

Os testes E2E do painel usam `E2E_ADMIN_EMAIL` e `E2E_ADMIN_PASSWORD` (crie um admin de teste).

## Publicação

1. Projeto Supabase de produção com as migrations (sem o seed) e cadastro público de usuários desligado.
2. Projeto Vercel com as variáveis do `.env.example` (a `SUPABASE_SERVICE_ROLE_KEY` é obrigatória:
   sem ela a loja não registra pedidos).
3. Domínio próprio em **Vercel › Settings › Domains** e `NEXT_PUBLIC_SITE_URL` com ele.
4. Mercado Pago (opcional): token, webhook e assinatura — veja `docs/NOVA-LOJA.md`.

## O que depende de credenciais externas

| Recurso | Sem credencial | Como ativar |
| --- | --- | --- |
| Loja, catálogo, carrinho, WhatsApp, painel | precisa de um projeto Supabase | `.env.local` / Vercel |
| Upload de fotos | precisa do Storage do Supabase (bucket criado pela migration) | — |
| Pagamento online (Pix/cartão) | o botão não aparece; a loja vende pelo WhatsApp | `MERCADOPAGO_ACCESS_TOKEN` + `MERCADOPAGO_WEBHOOK_SECRET` |
| GA4 / Meta Pixel | não carregam | IDs em Personalizar loja › SEO e integrações |

## Cuidados

- **Privacidade e Termos** são modelos alinhados à LGPD e ao CDC; cada lojista deve revisar com seu jurídico.
- **Avaliações**: cadastre somente avaliações reais e autorizadas. A loja não exibe nada inventado.
- **Limite de abuso**: o banco já limita pedidos e trocas (veja *Banco de dados*). Como segunda camada,
  crie em **Vercel › Firewall › Rules** uma regra *Rate Limit*: método `POST`, caminho `/checkout`
  ou `/troca`, 10 requisições por minuto por IP, ação `Deny`. No Supabase, mantenha o cadastro
  público desligado e, se quiser CAPTCHA no login do painel: cadastre `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`,
  publique e só então ligue o hCaptcha em **Authentication › Attack Protection** (na ordem inversa o login trava).
- **Imagens**: use fotos próprias da loja ou com licença. Fotos oficiais de fabricantes exigem autorização.

## Prévias para prospecção

Para mostrar a um lojista como a loja dele ficaria, sem criar um banco novo:

1. Adicione a "pele" da loja em `config/previews.ts` (nome, cor, fonte, tema, textos, endereço).
2. Na Vercel, crie um projeto a partir deste mesmo repositório com as variáveis da demo
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
   e mais `PREVIEW_PRESET=<chave>` (ex.: `rampage`, `jb-iphone`).

A prévia usa o catálogo e o WhatsApp da demonstração e mantém o aviso de demonstração ligado.
Ao fechar o contrato, a loja ganha o próprio projeto Supabase (veja `docs/NOVA-LOJA.md`).
