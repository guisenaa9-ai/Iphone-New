// Prévias de prospecção: a "pele" de uma loja real aplicada sobre o catálogo de demonstração.
// Ativada com PREVIEW_PRESET=<chave> num projeto Vercel separado. O banco continua o da demo,
// então o aviso de demonstração fica ligado e o WhatsApp de pedidos NÃO é o da loja.
// shortcut: o painel /admin dessas prévias edita o banco da demo, não a prévia; para editar, mude este arquivo.

export const PREVIEWS: Record<string, unknown> = {
  rampage: {
    brand: {
      name: "Rampage",
      logoUrl: "/previews/rampage.jpg", // enviado pelo usuário para a prévia
      logoWithName: true,
      headerFrom: "#1a3fd6", // azul escuro do logotipo
      headerTo: "#1677d2", // tom mais claro que ainda segura texto branco (4,56:1)
      faviconUrl: "/previews/rampage.jpg",
      tagline: "iPhones novos e seminovos no Adrianópolis, com troca do seu usado.",
      accent: "#1a66f5",
      font: "jakarta",
      theme: "dark",
    },
    contact: {
      address: "Av. André Araújo, 97 — Adrianópolis, Manaus/AM",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Av.%20Andr%C3%A9%20Ara%C3%BAjo%2C%2097%2C%20Adrian%C3%B3polis%2C%20Manaus",
      phone: "",
      email: "",
      instagram: "",
      facebook: "https://www.facebook.com/p/Loja-Rampage-Manaus-100092506297209/",
      tiktok: "",
    },
    hero: {
      eyebrow: "Rampage · Manaus",
      title: "Seu próximo iPhone está na André Araújo.",
      subtitle: "Novos e seminovos com a saúde da bateria à vista. Traga o seu usado como entrada e feche tudo pelo WhatsApp.",
      primaryLabel: "Ver iPhones",
      secondaryLabel: "Avaliar meu usado",
      secondaryHref: "/troca",
    },
    content: {
      about:
        "Esta é uma prévia criada para a Rampage, mostrando como a loja ficaria com catálogo próprio, troca do aparelho usado e pedidos pelo WhatsApp.\n\nOs produtos, preços e estoques são ilustrativos.",
      legalName: "Rampage (prévia)",
      demoNotice: true,
    },
    commerce: { orderPrefix: "RMP" },
    seo: {
      title: "Rampage — iPhones novos e seminovos em Manaus (prévia)",
      description: "Prévia de loja virtual da Rampage: iPhones novos e seminovos, troca do usado e pedido pelo WhatsApp.",
    },
  },

  "jb-iphone": {
    brand: {
      name: "JB iPhone",
      tagline: "iPhones em Manaus com atendimento próximo e pós-venda.",
      accent: "#1d4ed8",
      font: "inter",
      theme: "light",
    },
    contact: { address: "", mapsUrl: "", phone: "", email: "", instagram: "", facebook: "", tiktok: "" },
    hero: {
      eyebrow: "JB iPhone · Manaus",
      title: "O iPhone que você quer, com quem entende.",
      subtitle: "Escolha modelo, cor e capacidade, veja o preço na hora e finalize com a equipe pelo WhatsApp.",
      primaryLabel: "Explorar iPhones",
      secondaryLabel: "Ver ofertas",
    },
    content: {
      about:
        "Esta é uma prévia criada para a JB iPhone, mostrando como a loja ficaria com catálogo próprio, entrega em Manaus e pedidos pelo WhatsApp.\n\nOs produtos, preços e estoques são ilustrativos.",
      legalName: "JB iPhone (prévia)",
      demoNotice: true,
    },
    commerce: { orderPrefix: "JB" },
    seo: {
      title: "JB iPhone — iPhones em Manaus (prévia)",
      description: "Prévia de loja virtual da JB iPhone: catálogo de iPhones, entrega em Manaus e pedido pelo WhatsApp.",
    },
  },
};
