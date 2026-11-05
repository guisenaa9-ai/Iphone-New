// Prévias de prospecção: a "pele" de uma loja real aplicada sobre o catálogo de demonstração.
// Ativada com PREVIEW_PRESET=<chave> num projeto Vercel separado. O banco continua o da demo,
// então o aviso de demonstração fica ligado e o WhatsApp de pedidos NÃO é o da loja.
// shortcut: o painel /admin dessas prévias edita o banco da demo, não a prévia; para editar, mude este arquivo.

export const PREVIEWS: Record<string, unknown> = {
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
