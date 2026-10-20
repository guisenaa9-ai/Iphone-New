# Lançar uma nova loja

Procedimento para colocar um novo cliente no ar com a mesma base de código.
Cada loja tem **projeto Supabase próprio** (dados, pedidos, clientes e chaves isolados)
e **projeto Vercel próprio** (domínio e variáveis próprios). O código é o mesmo para todas.

Tempo estimado: 40 a 60 minutos, mais o cadastro do catálogo.

## 0. Colete com o lojista

- [ ] Nome da loja, razão social e CNPJ
- [ ] Logotipo (SVG ou PNG transparente), versão para fundo escuro se houver, favicon
- [ ] Cor da marca (hex) e preferência de tema (claro, escuro ou automático)
- [ ] WhatsApp de vendas (com DDD), telefone, e-mail, endereço, link do Google Maps, horário
- [ ] Instagram / Facebook / TikTok
- [ ] Como vende: só WhatsApp, só online ou os dois
- [ ] Retirada na loja? Entrega? Bairros atendidos, taxa e prazo de cada um
- [ ] Parcelamento real: máximo de parcelas, sem juros até quantas, juros ao mês acima disso
- [ ] Garantia de cada tipo de produto (novo, seminovo, recondicionado), exatamente como oferece
- [ ] Domínio (ex.: `www.loja.com.br`) e acesso ao DNS
- [ ] Se for vender online: conta Mercado Pago do lojista (as credenciais são DELE)

> Não invente condições. Frete grátis, garantia, desconto e parcelamento só entram se o lojista oferecer.

## 1. Banco de dados (Supabase)

1. Crie um projeto em <https://supabase.com/dashboard> — região **São Paulo (sa-east-1)**.
2. Aplique as migrations, na ordem, de `supabase/migrations/`:
   - pelo CLI: `npx supabase link --project-ref <ref>` e depois `npx supabase db push`; ou
   - pelo painel: **SQL Editor**, cole e rode cada arquivo em ordem.
3. **Não** rode `supabase/seed.sql` (é a loja de demonstração).
4. Em **Authentication › Sign In / Providers**, desative **Allow new users to sign up**.
   (Clientes não precisam de conta; só a equipe da loja entra no painel.)
5. Crie o usuário do lojista em **Authentication › Users › Add user** (e-mail e senha).
6. Torne-o administrador no **SQL Editor**:

   ```sql
   insert into public.admin_users (user_id, role)
   select id, 'owner' from auth.users where email = 'dono@loja.com.br';
   ```

7. Rode **Advisors › Security** e confira que não há alertas de RLS.

## 2. Hospedagem (Vercel)

1. **Add New › Project** e importe este repositório (cada loja é um projeto Vercel separado).
2. Em **Environment Variables**, cadastre as variáveis do `.env.example` com os valores DESTA loja.
   A `SUPABASE_SERVICE_ROLE_KEY` e as chaves do Mercado Pago ficam só aqui — nunca no código.
3. Deploy. Região sugerida das funções: `gru1` (São Paulo), em **Settings › Functions**.
4. **Settings › Domains**: adicione o domínio do lojista e crie no DNS os registros que a Vercel mostrar.
5. Atualize `NEXT_PUBLIC_SITE_URL` com o domínio final e faça **Redeploy**.
6. No Supabase, **Authentication › URL Configuration**: Site URL = domínio da loja.

## 3. Personalização (sem código)

Entre em `https://dominio/admin` com o usuário do lojista e preencha **Personalizar loja**:

- **Marca**: nome, frase, logotipos, favicon, cor (o painel mostra o contraste), fonte e tema
- **Contato**: WhatsApp (formato `5592999999999`), endereço, link do Maps, horário, redes
- **Página inicial**: título, subtítulo, botões, imagem e promoções sazonais com datas
- **Conteúdo**: texto "Sobre", benefícios reais, perguntas frequentes, razão social e CNPJ
  (deixe **desligado** o "Aviso de loja de demonstração")
- **Vendas**: modo de venda, retirada, entrega, texto de pagamento, parcelamento, prefixo dos pedidos
- **SEO e integrações**: título e descrição para o Google, imagem de compartilhamento, GA4 e Meta Pixel

Depois:

- **Entregas**: cadastre os bairros com taxa e prazo
- **Produtos**: cadastre o catálogo (variantes de armazenamento, cor e condição; preço, estoque, fotos)
- **Avaliações**: só avaliações reais, com autorização do cliente

## 4. Pagamento online (opcional)

1. No Mercado Pago do lojista: **Suas integrações › Criar aplicação** (Checkout Pro).
2. Copie o **Access Token de produção** para `MERCADOPAGO_ACCESS_TOKEN`.
3. Em **Webhooks**, cadastre `https://dominio/api/webhooks/mercadopago` com o evento **Pagamentos**
   e copie a **assinatura secreta** para `MERCADOPAGO_WEBHOOK_SECRET`.
4. Redeploy. Em **Personalizar loja › Vendas** deve aparecer "Mercado Pago configurado no servidor".
5. Faça uma compra de teste com valor baixo e confira que o pedido muda para **Pago** sozinho.

O parcelamento cobrado no checkout segue as regras da conta Mercado Pago do lojista;
deixe as condições do painel iguais às da conta para o cliente ver o mesmo valor.

## 5. Checklist de lançamento

- [ ] Aviso de demonstração desligado; nenhum dado da NOVA iPHONE na loja
- [ ] WhatsApp de teste recebe a mensagem de um pedido
- [ ] Retirada e entrega mostram as taxas certas
- [ ] Páginas **Privacidade** e **Termos** revisadas pelo lojista (são modelos; o jurídico dele deve validar)
- [ ] CNPJ e razão social no rodapé
- [ ] Teste no celular (abra pelo link do Instagram e pelo WhatsApp)
- [ ] `https://dominio/sitemap.xml` abre; envie ao Google Search Console
- [ ] Usuário admin com senha forte; cadastro público de usuários desligado
