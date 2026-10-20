-- Demonstração comercial: loja fictícia NOVA iPHONE.
-- Todos os preços, estoques, bairros, taxas e contatos são ILUSTRATIVOS.
-- Não rode em uma loja real: use docs/NOVA-LOJA.md para começar uma instalação limpa.

update public.store_settings set data = $json$
{
  "brand": {
    "name": "NOVA iPHONE",
    "tagline": "iPhones novos e seminovos selecionados, com atendimento próximo em Manaus.",
    "logoUrl": "", "logoDarkUrl": "", "faviconUrl": "",
    "accent": "#c9a46c",
    "font": "manrope",
    "theme": "dark"
  },
  "contact": {
    "whatsapp": "5592900000000",
    "phone": "(92) 90000-0000",
    "email": "contato@exemplo.com.br",
    "address": "Av. Exemplo, 1000 — Adrianópolis, Manaus/AM (endereço demonstrativo)",
    "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Adrian%C3%B3polis%2C%20Manaus%20-%20AM",
    "hours": "Seg. a sex.: 9h às 19h\nSábado: 9h às 14h",
    "instagram": "https://www.instagram.com/", "facebook": "", "tiktok": ""
  },
  "hero": {
    "eyebrow": "Nova coleção",
    "title": "O iPhone certo, do jeito certo.",
    "subtitle": "Modelos novos e seminovos, saúde da bateria à vista e atendimento direto pelo WhatsApp.",
    "imageUrl": "",
    "primaryLabel": "Explorar iPhones", "primaryHref": "/catalogo?categoria=iphone",
    "secondaryLabel": "Ver ofertas", "secondaryHref": "/catalogo?ofertas=1"
  },
  "banners": [],
  "content": {
    "about": "A NOVA iPHONE é uma loja de demonstração criada para apresentar a plataforma.\n\nAqui você vê como uma loja especializada em Apple pode mostrar seu catálogo, variantes, seminovos com saúde de bateria e finalizar pedidos pelo WhatsApp ou com pagamento online.",
    "benefits": [
      { "title": "Atendimento pelo WhatsApp", "text": "Tire dúvidas e finalize o pedido falando direto com a equipe." },
      { "title": "Retirada ou entrega em Manaus", "text": "Retire na loja ou receba em casa nos bairros atendidos, com a taxa exibida antes de fechar." },
      { "title": "Pix e cartão", "text": "As condições de parcelamento aparecem em cada produto." },
      { "title": "Seu usado na troca", "text": "Envie os dados do seu aparelho e receba uma proposta da equipe." },
      { "title": "Seminovos transparentes", "text": "Condição e saúde da bateria informadas em cada anúncio." },
      { "title": "Estoque atualizado", "text": "A disponibilidade de cada cor e capacidade é conferida no fechamento." }
    ],
    "faq": [
      { "q": "Como funciona a compra pelo WhatsApp?", "a": "Escolha os produtos, informe seus dados e toque em Finalizar pelo WhatsApp. O pedido é registrado com um código e uma mensagem com o resumo é aberta para você enviar à loja." },
      { "q": "Vocês entregam em toda Manaus?", "a": "A entrega atende os bairros listados em Entrega e retirada. A taxa de cada bairro aparece antes de você finalizar." },
      { "q": "Posso dar meu aparelho usado como parte do pagamento?", "a": "Sim. Envie os dados pelo formulário de avaliação. A proposta é feita pela equipe depois de analisar o aparelho." },
      { "q": "Os seminovos mostram a saúde da bateria?", "a": "Sim. Cada anúncio de seminovo informa a condição do aparelho e a porcentagem de saúde da bateria." },
      { "q": "Esta loja é real?", "a": "Não. A NOVA iPHONE é uma demonstração: preços, estoque e contatos são ilustrativos." }
    ],
    "legalName": "NOVA iPHONE (demonstração)",
    "cnpj": "",
    "demoNotice": true
  },
  "commerce": {
    "salesMode": "both",
    "pickupEnabled": true,
    "pickupInfo": "Pronto para retirada após a confirmação da loja.",
    "deliveryEnabled": true,
    "deliveryInfo": "Entrega combinada pelo WhatsApp após a confirmação.",
    "paymentInfo": "Pix, cartão de crédito em até 12x (condições demonstrativas).",
    "orderPrefix": "NOVA",
    "installmentsMax": 12,
    "installmentsInterestFree": 10,
    "installmentsMonthlyRate": 2.49,
    "lowStockThreshold": 2
  },
  "seo": {
    "title": "NOVA iPHONE — iPhones novos e seminovos em Manaus",
    "description": "Demonstração de loja de iPhones em Manaus: novos e seminovos, retirada na loja, entrega local e atendimento pelo WhatsApp.",
    "ogImageUrl": ""
  },
  "analytics": { "ga4Id": "", "metaPixelId": "" }
}
$json$::jsonb where id = 1;

insert into public.delivery_zones (name, fee_cents, eta, sort_order) values
  ('Adrianópolis', 1000, 'No mesmo dia', 1),
  ('Nossa Senhora das Graças (Vieiralves)', 1000, 'No mesmo dia', 2),
  ('Aleixo', 1500, 'No mesmo dia', 3),
  ('Parque 10 de Novembro', 1500, 'No mesmo dia', 4),
  ('Centro', 1500, 'No mesmo dia', 5),
  ('Flores', 1500, 'Até 1 dia útil', 6),
  ('Ponta Negra', 2000, 'Até 1 dia útil', 7),
  ('Cidade Nova', 2000, 'Até 1 dia útil', 8);

-- Ajudante temporário para cadastrar produto + variantes.
create function pg_temp.add_product(
  p_slug text, p_name text, p_category text, p_family text, p_description text,
  p_specs jsonb, p_featured boolean, p_launch boolean, p_sort int, p_variants jsonb, p_days_ago int default 0)
returns void language plpgsql as $$
declare pid uuid; v jsonb; i int := 0;
begin
  insert into public.products (slug, name, category, family, description, specs, warranty, is_featured, is_launch, sort_order, created_at)
  values (p_slug, p_name, p_category, p_family, p_description, p_specs,
    'Garantia conforme a política da loja. Consulte as condições antes da compra.', p_featured, p_launch, p_sort,
    now() - make_interval(days => p_days_ago))
  returning id into pid;
  for v in select * from jsonb_array_elements(p_variants) loop
    i := i + 1;
    insert into public.product_variants (product_id, color_name, color_hex, storage, condition, battery_health,
      price_cents, compare_at_cents, stock, sort_order)
    values (pid, v->>'c', v->>'h', v->>'s', coalesce(v->>'k', 'novo'), (v->>'b')::smallint,
      (v->>'p')::int, (v->>'o')::int, (v->>'q')::int, i);
  end loop;
end $$;

select pg_temp.add_product('iphone-16-pro-max', 'iPhone 16 Pro Max', 'iphone', 'iPhone 16 Pro',
  'Tela de 6,9 polegadas, chip A18 Pro e sistema de câmeras Pro com teleobjetiva 5x. Acabamento em titânio.',
  '[{"label":"Tela","value":"6,9\" Super Retina XDR, ProMotion"},{"label":"Chip","value":"A18 Pro"},{"label":"Câmeras","value":"48 MP Fusion, 48 MP ultra-angular, 12 MP teleobjetiva 5x"},{"label":"Conector","value":"USB-C (USB 3)"},{"label":"Material","value":"Titânio"}]',
  true, true, 1,
  '[{"c":"Titânio-deserto","h":"#bfa48a","s":"256 GB","p":1049900,"q":3},
    {"c":"Titânio-deserto","h":"#bfa48a","s":"512 GB","p":1199900,"q":1},
    {"c":"Titânio-preto","h":"#3b3a39","s":"256 GB","p":1049900,"q":4},
    {"c":"Titânio-preto","h":"#3b3a39","s":"512 GB","p":1199900,"q":2},
    {"c":"Titânio-preto","h":"#3b3a39","s":"1 TB","p":1349900,"q":1},
    {"c":"Titânio-natural","h":"#b6afa5","s":"256 GB","p":1049900,"q":2},
    {"c":"Titânio-branco","h":"#e6e3dd","s":"256 GB","p":1049900,"q":0},
    {"c":"Titânio-branco","h":"#e6e3dd","s":"512 GB","p":1199900,"q":2}]', 2);

select pg_temp.add_product('iphone-16-pro', 'iPhone 16 Pro', 'iphone', 'iPhone 16 Pro',
  'O Pro em tamanho de 6,3 polegadas, com chip A18 Pro e as mesmas câmeras do Pro Max.',
  '[{"label":"Tela","value":"6,3\" Super Retina XDR, ProMotion"},{"label":"Chip","value":"A18 Pro"},{"label":"Câmeras","value":"48 MP Fusion, 48 MP ultra-angular, 12 MP teleobjetiva 5x"},{"label":"Conector","value":"USB-C (USB 3)"},{"label":"Material","value":"Titânio"}]',
  true, true, 2,
  '[{"c":"Titânio-natural","h":"#b6afa5","s":"128 GB","p":899900,"q":3},
    {"c":"Titânio-natural","h":"#b6afa5","s":"256 GB","p":979900,"q":2},
    {"c":"Titânio-preto","h":"#3b3a39","s":"128 GB","p":899900,"q":5},
    {"c":"Titânio-preto","h":"#3b3a39","s":"256 GB","p":979900,"q":3},
    {"c":"Titânio-deserto","h":"#bfa48a","s":"256 GB","p":979900,"q":2},
    {"c":"Titânio-branco","h":"#e6e3dd","s":"512 GB","p":1129900,"q":1}]', 3);

select pg_temp.add_product('iphone-16', 'iPhone 16', 'iphone', 'iPhone 16',
  'Chip A18, botão de Ação, Controle da Câmera e câmera Fusion de 48 MP em cores vibrantes.',
  '[{"label":"Tela","value":"6,1\" Super Retina XDR"},{"label":"Chip","value":"A18"},{"label":"Câmeras","value":"48 MP Fusion, 12 MP ultra-angular"},{"label":"Conector","value":"USB-C"}]',
  true, true, 3,
  '[{"c":"Ultramarino","h":"#7d8fd8","s":"128 GB","p":679900,"q":4},
    {"c":"Ultramarino","h":"#7d8fd8","s":"256 GB","p":759900,"q":2},
    {"c":"Verde-acinzentado","h":"#a3bdb1","s":"128 GB","p":679900,"q":3},
    {"c":"Rosa","h":"#f0c3cf","s":"128 GB","p":679900,"q":2},
    {"c":"Branco","h":"#f2f2ef","s":"128 GB","p":679900,"q":3},
    {"c":"Preto","h":"#3a3a3c","s":"128 GB","p":679900,"q":6},
    {"c":"Preto","h":"#3a3a3c","s":"256 GB","p":759900,"q":3}]', 4);

select pg_temp.add_product('iphone-16e', 'iPhone 16e', 'iphone', 'iPhone 16',
  'O jeito mais acessível de ter o chip A18, com câmera Fusion de 48 MP e bateria para o dia todo.',
  '[{"label":"Tela","value":"6,1\" Super Retina XDR"},{"label":"Chip","value":"A18"},{"label":"Câmera","value":"48 MP Fusion"},{"label":"Conector","value":"USB-C"}]',
  false, false, 4,
  '[{"c":"Branco","h":"#f2f2ef","s":"128 GB","p":469900,"q":4},
    {"c":"Preto","h":"#2f2f31","s":"128 GB","p":469900,"q":5},
    {"c":"Preto","h":"#2f2f31","s":"256 GB","p":549900,"q":2}]', 20);

select pg_temp.add_product('iphone-15', 'iPhone 15', 'iphone', 'iPhone 15',
  'Dynamic Island, câmera principal de 48 MP e USB-C, com vidro colorido e acabamento fosco.',
  '[{"label":"Tela","value":"6,1\" Super Retina XDR"},{"label":"Chip","value":"A16 Bionic"},{"label":"Câmeras","value":"48 MP principal, 12 MP ultra-angular"},{"label":"Conector","value":"USB-C"}]',
  false, false, 5,
  '[{"c":"Azul","h":"#d4e1ea","s":"128 GB","p":499900,"o":579900,"q":3},
    {"c":"Rosa","h":"#f4d8dd","s":"128 GB","p":499900,"o":579900,"q":2},
    {"c":"Preto","h":"#3d4146","s":"128 GB","p":499900,"o":579900,"q":4},
    {"c":"Preto","h":"#3d4146","s":"256 GB","p":579900,"o":649900,"q":1}]', 40);

select pg_temp.add_product('iphone-15-pro-seminovo', 'iPhone 15 Pro', 'iphone', 'iPhone 15 Pro',
  'Seminovo com chip A17 Pro, estrutura em titânio e teleobjetiva 3x. Condição e bateria informadas em cada opção.',
  '[{"label":"Tela","value":"6,1\" Super Retina XDR, ProMotion"},{"label":"Chip","value":"A17 Pro"},{"label":"Câmeras","value":"48 MP principal, 12 MP ultra-angular, 12 MP teleobjetiva 3x"},{"label":"Conector","value":"USB-C (USB 3)"}]',
  true, false, 6,
  '[{"c":"Titânio-azul","h":"#414b5c","s":"128 GB","k":"seminovo","b":89,"p":549900,"q":1},
    {"c":"Titânio-azul","h":"#414b5c","s":"256 GB","k":"seminovo","b":92,"p":609900,"q":1},
    {"c":"Titânio-natural","h":"#bdb7ad","s":"128 GB","k":"seminovo","b":87,"p":539900,"q":1},
    {"c":"Titânio-preto","h":"#3c3c3e","s":"256 GB","k":"seminovo","b":95,"p":619900,"q":1}]', 10);

select pg_temp.add_product('iphone-14-seminovo', 'iPhone 14', 'iphone', 'iPhone 14',
  'Seminovo com chip A15 Bionic e sistema de câmera dupla. Ótimo custo-benefício.',
  '[{"label":"Tela","value":"6,1\" Super Retina XDR"},{"label":"Chip","value":"A15 Bionic"},{"label":"Câmeras","value":"12 MP principal, 12 MP ultra-angular"},{"label":"Conector","value":"Lightning"}]',
  false, false, 7,
  '[{"c":"Meia-noite","h":"#2e3239","s":"128 GB","k":"seminovo","b":88,"p":299900,"q":2},
    {"c":"Estelar","h":"#efe9e1","s":"128 GB","k":"seminovo","b":91,"p":309900,"q":1},
    {"c":"Roxo","h":"#d8cfe4","s":"128 GB","k":"seminovo","b":86,"p":289900,"q":1},
    {"c":"Meia-noite","h":"#2e3239","s":"256 GB","k":"seminovo","b":90,"p":339900,"q":1}]', 12);

select pg_temp.add_product('iphone-13-recondicionado', 'iPhone 13', 'iphone', 'iPhone 13',
  'Recondicionado com bateria nova. Chip A15 Bionic e câmera dupla de 12 MP.',
  '[{"label":"Tela","value":"6,1\" Super Retina XDR"},{"label":"Chip","value":"A15 Bionic"},{"label":"Câmeras","value":"12 MP principal, 12 MP ultra-angular"},{"label":"Conector","value":"Lightning"}]',
  false, false, 8,
  '[{"c":"Azul","h":"#2d4a6a","s":"128 GB","k":"recondicionado","b":100,"p":249900,"o":279900,"q":2},
    {"c":"Meia-noite","h":"#2b2f36","s":"128 GB","k":"recondicionado","b":100,"p":249900,"o":279900,"q":1}]', 15);

select pg_temp.add_product('airpods-pro-2', 'AirPods Pro (2ª geração)', 'airpods', null,
  'Cancelamento ativo de ruído, modo Ambiente e estojo de carregamento USB-C.',
  '[{"label":"Conexão","value":"Bluetooth"},{"label":"Estojo","value":"USB-C, compatível com MagSafe"}]',
  false, false, 10,
  '[{"c":"Branco","h":"#f4f4f2","p":189900,"q":5}]', 30);

select pg_temp.add_product('carregador-usb-c-20w', 'Carregador USB-C 20 W', 'acessorio', null,
  'Carregamento rápido para iPhone com conector USB-C.',
  '[{"label":"Potência","value":"20 W"},{"label":"Entrada","value":"USB-C"}]',
  false, false, 11,
  '[{"c":"Branco","h":"#f4f4f2","p":19900,"q":20}]', 50);

select pg_temp.add_product('cabo-usb-c-1m', 'Cabo USB-C 1 m', 'acessorio', null,
  'Cabo trançado para carregar e sincronizar dispositivos USB-C.',
  '[{"label":"Comprimento","value":"1 m"},{"label":"Conectores","value":"USB-C / USB-C"}]',
  false, false, 12,
  '[{"c":"Branco","h":"#f4f4f2","p":12900,"q":25}]', 50);

select pg_temp.add_product('capa-silicone-16-pro', 'Capa de silicone para iPhone 16 Pro', 'acessorio', null,
  'Silicone macio ao toque, interior em microfibra e compatível com carregamento magnético.',
  '[{"label":"Compatível com","value":"iPhone 16 Pro"},{"label":"Material","value":"Silicone"}]',
  false, false, 13,
  '[{"c":"Preto","h":"#2b2b2d","p":24900,"q":6},
    {"c":"Azul-denim","h":"#4d6a8f","p":24900,"q":4},
    {"c":"Rosa-claro","h":"#f1cdd2","p":24900,"o":29900,"q":3}]', 25);
