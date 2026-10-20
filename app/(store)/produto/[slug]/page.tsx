import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProductBuy } from "@/components/store/product-buy";
import { ProductShelf } from "@/components/store/sections";
import { CATEGORY_LABEL, cheapest, getDeliveryZones, getProduct, getProducts, getSettings, variantImages, variantLabel } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ v?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return { title: "Produto não encontrado" };
  const img = variantImages(p, cheapest(p))[0];
  return {
    title: p.name,
    description: p.description.slice(0, 160) || undefined,
    alternates: { canonical: `/produto/${p.slug}` },
    openGraph: { title: p.name, description: p.description.slice(0, 160), images: img ? [img] : undefined },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ slug }, { v }] = await Promise.all([params, searchParams]);
  const [product, s, all, zones] = await Promise.all([getProduct(slug), getSettings(), getProducts(), getDeliveryZones()]);
  if (!product) notFound();

  const related = all
    .filter((p) => p.id !== product.id && (p.family && p.family === product.family ? true : p.category === product.category))
    .slice(0, 4);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(product.category !== "acessorio" && { brand: { "@type": "Brand", name: "Apple" } }),
    image: variantImages(product, cheapest(product)),
    offers: product.variants.map((x) => ({
      "@type": "Offer",
      sku: x.sku ?? x.id,
      name: `${product.name} ${variantLabel(x)}`.trim(),
      priceCurrency: "BRL",
      price: (x.price_cents / 100).toFixed(2),
      availability: x.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: x.condition === "novo" ? "https://schema.org/NewCondition" : x.condition === "seminovo" ? "https://schema.org/UsedCondition" : "https://schema.org/RefurbishedCondition",
      url: `${siteUrl}/produto/${product.slug}?v=${x.id}`,
      seller: { "@type": "Organization", name: s.brand.name },
    })),
  };

  return (
    <div className="pb-24 lg:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <div className="container-page py-6 sm:py-10">
        <Breadcrumbs
          items={[
            { label: "Início", href: "/" },
            { label: CATEGORY_LABEL[product.category], href: `/catalogo?categoria=${product.category}` },
            ...(product.family && product.family !== product.name ? [{ label: product.family, href: `/catalogo?linha=${encodeURIComponent(product.family)}` }] : []),
            { label: product.name },
          ]}
        />
        <div className="mt-6">
          <ProductBuy
            key={product.id}
            product={product}
            commerce={s.commerce}
            storeName={s.brand.name}
            whatsapp={s.contact.whatsapp}
            initialVariantId={v}
            zonesCount={zones.length}
          />
        </div>
      </div>
      <ProductShelf title="Você também pode gostar" products={related} commerce={s.commerce} />
    </div>
  );
}
