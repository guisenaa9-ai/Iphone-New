import { CartProvider } from "@/components/store/cart";
import { Analytics } from "@/components/store/analytics";
import { Footer } from "@/components/store/footer";
import { Header, type NavLink } from "@/components/store/header";
import { WhatsAppFab } from "@/components/store/whatsapp-fab";
import { cheapest, colorsOf, getProducts, getSettings, isUsed, onSale, variantImages, CATEGORY_LABEL } from "@/lib/catalog";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [s, products] = await Promise.all([getSettings(), getProducts()]);

  // Menu montado a partir do catálogo real: nenhum link leva a uma página vazia.
  const cats = new Set(products.map((p) => p.category));
  const nav: NavLink[] = [
    ...(cats.has("iphone") ? [{ href: "/catalogo?categoria=iphone", label: "iPhone" }] : []),
    ...(products.some(isUsed) ? [{ href: "/catalogo?condicao=seminovo", label: "Seminovos" }] : []),
    ...[...cats]
      .filter((c) => c !== "iphone")
      .map((c) => ({ href: `/catalogo?categoria=${c}`, label: CATEGORY_LABEL[c] })),
    ...(products.some(onSale) ? [{ href: "/catalogo?ofertas=1", label: "Ofertas" }] : []),
    { href: "/sobre", label: "Sobre" },
    { href: "/sobre#contato", label: "Contato" },
  ];

  const searchItems = products.map((p) => {
    const v = cheapest(p);
    return {
      slug: p.slug,
      name: p.name,
      keywords: `${p.family ?? ""} ${CATEGORY_LABEL[p.category]} ${colorsOf(p).map((c) => c.name).join(" ")} ${p.variants.map((x) => x.storage).join(" ")}`,
      priceCents: v.price_cents,
      category: p.category,
      colorHex: v.color_hex,
      image: variantImages(p, v)[0] ?? null,
    };
  });

  return (
    <CartProvider>
      {s.content.demoNotice && (
        <p className="border-b border-border bg-bg-subtle px-4 py-2 text-center text-[13px] text-muted">
          Loja de demonstração — preços, estoque e condições são ilustrativos.
        </p>
      )}
      <Header brand={s.brand} nav={nav} whatsapp={s.contact.whatsapp} searchItems={searchItems} />
      <main id="conteudo">{children}</main>
      <Footer s={s} nav={nav.filter((l) => !l.href.startsWith("/sobre"))} />
      <WhatsAppFab number={s.contact.whatsapp} storeName={s.brand.name} />
      <Analytics ga4Id={s.analytics.ga4Id} metaPixelId={s.analytics.metaPixelId} />
    </CartProvider>
  );
}
