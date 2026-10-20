import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MessageCircle, Repeat, Star } from "lucide-react";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PhoneArt } from "@/components/store/device-art";
import { ProductShelf, Section, SectionHeader } from "@/components/store/sections";
import { cheapest, colorsOf, getBestSellerIds, getProducts, getReviews, getSettings, isUsed, onSale } from "@/lib/catalog";
import { formatBRL } from "@/lib/money";
import { activeBanners } from "@/lib/settings";
import { waLink } from "@/lib/whatsapp";

export default async function Home() {
  const [s, products, bestIds, reviews] = await Promise.all([getSettings(), getProducts(), getBestSellerIds(), getReviews()]);
  const c = s.commerce;
  const featured = products.filter((p) => p.is_featured);
  const heroProduct = featured.find((p) => p.category === "iphone") ?? products.find((p) => p.category === "iphone");
  const heroColors = heroProduct ? colorsOf(heroProduct) : [];
  const families = [...new Set(products.filter((p) => p.category === "iphone").map((p) => p.family).filter(Boolean))] as string[];
  const best = bestIds.map((id) => products.find((p) => p.id === id)).filter((p) => p !== undefined);
  const banners = activeBanners(s);

  const faqLd = s.content.faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: s.content.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }
    : null;
  const storeLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: s.brand.name,
    ...(s.contact.address && { address: s.contact.address }),
    ...(s.contact.phone && { telephone: s.contact.phone }),
    ...(s.contact.hours && { openingHours: s.contact.hours }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeLd).replace(/</g, "\\u003c") }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }} />}

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_70%_45%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent_70%)]" />
        <div className="container-page grid items-center gap-8 pb-12 pt-10 sm:pt-16 lg:min-h-[min(760px,calc(100dvh-4rem))] lg:grid-cols-[1.05fr_1fr] lg:pb-20">
          <div className="hero-in grid gap-5 max-lg:text-center">
            {s.hero.eyebrow && <p className="text-eyebrow text-accent">{s.hero.eyebrow}</p>}
            <h1 className="text-display text-balance">{s.hero.title}</h1>
            {s.hero.subtitle && <p className="mx-auto max-w-xl text-[18px] leading-relaxed text-muted lg:mx-0 lg:text-[20px]">{s.hero.subtitle}</p>}
            <div className="mt-3 flex flex-wrap gap-3 max-lg:justify-center">
              {s.hero.primaryLabel && (
                <ButtonLink href={s.hero.primaryHref || "/catalogo"} size="lg">
                  {s.hero.primaryLabel}
                </ButtonLink>
              )}
              {s.hero.secondaryLabel && (
                <ButtonLink href={s.hero.secondaryHref || "/catalogo"} size="lg" variant="secondary">
                  {s.hero.secondaryLabel}
                </ButtonLink>
              )}
            </div>
            {heroProduct && !s.hero.imageUrl && (
              <p className="text-[14px] text-muted">
                <Link href={`/produto/${heroProduct.slug}`} className="underline-offset-4 hover:underline">
                  {heroProduct.name}
                </Link>{" "}
                a partir de {formatBRL(cheapest(heroProduct).price_cents)}
              </p>
            )}
          </div>
          <div className="relative mx-auto aspect-[5/6] w-full max-w-[460px]">
            {s.hero.imageUrl ? (
              <Image src={s.hero.imageUrl} alt="" fill priority sizes="(min-width: 1024px) 460px, 90vw" className="hero-in object-contain" unoptimized={!s.hero.imageUrl.includes("/storage/v1/object/public/")} />
            ) : (
              <>
                <div aria-hidden className="absolute inset-[18%_10%] rounded-full bg-accent/25 blur-3xl" />
                {heroColors[1] && (
                  <div className="hero-in absolute left-[8%] top-[12%] w-[46%] -rotate-[8deg] opacity-95" style={{ animationDelay: "180ms" }}>
                    <PhoneArt color={heroColors[1].hex ?? undefined} lenses={/pro/i.test(heroProduct?.name ?? "") ? 3 : 2} />
                  </div>
                )}
                <div className={`hero-float absolute w-[52%] ${heroColors[1] ? "right-[8%] top-[4%] rotate-[6deg]" : "left-[24%] top-[4%]"}`}>
                  <PhoneArt color={heroColors[0]?.hex ?? "#2b2b2e"} lenses={/pro/i.test(heroProduct?.name ?? "") ? 3 : 2} />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Promoções sazonais cadastradas no painel */}
      {banners.length > 0 && (
        <section aria-label="Promoções" className="container-page">
          <ul className={`grid gap-4 ${banners.length > 1 ? "md:grid-cols-2" : ""}`}>
            {banners.map((b, i) => (
              <li key={i}>
                <Link href={b.href || "/catalogo?ofertas=1"} className="group relative flex min-h-44 items-end overflow-hidden rounded-[28px] bg-fg p-7 text-bg">
                  {b.imageUrl && (
                    <Image src={b.imageUrl} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover opacity-60 transition-transform duration-700 ease-premium group-hover:scale-[1.03]" unoptimized={!b.imageUrl.includes("/storage/v1/object/public/")} />
                  )}
                  <span className="relative grid gap-1">
                    <span className="text-[24px] font-semibold tracking-[-0.02em]">{b.title}</span>
                    {b.subtitle && <span className="text-[15px] opacity-80">{b.subtitle}</span>}
                    <span className="mt-2 inline-flex items-center gap-1 text-[15px] font-medium">
                      Conferir <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {families.length > 1 && (
        <nav aria-label="Linhas de iPhone" className="container-page pt-10">
          <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {families.map((f) => (
              <li key={f} className="shrink-0">
                <Link href={`/catalogo?linha=${encodeURIComponent(f)}`} className="inline-flex h-11 items-center rounded-full bg-bg-subtle px-5 text-[15px] font-medium ring-1 ring-border transition-colors hover:bg-surface hover:ring-border-strong">
                  {f}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <ProductShelf eyebrow="Selecionados" title="iPhones em destaque" href="/catalogo?categoria=iphone" products={featured} commerce={c} />
      <ProductShelf eyebrow="Novidades" title="Lançamentos" href="/catalogo?ordem=novidades" products={products.filter((p) => p.is_launch)} commerce={c} />
      <ProductShelf eyebrow="Preferidos dos clientes" title="Mais vendidos" products={best} commerce={c} />
      <ProductShelf eyebrow="Ofertas" title="Ofertas especiais" href="/catalogo?ofertas=1" products={products.filter(onSale)} commerce={c} id="ofertas" />
      <ProductShelf eyebrow="Seminovos" title="iPhones seminovos" href="/catalogo?condicao=seminovo" products={products.filter(isUsed)} commerce={c} />
      <ProductShelf eyebrow="Complete o seu setup" title="Acessórios" href="/catalogo?categoria=acessorio" products={products.filter((p) => p.category === "acessorio")} commerce={c} />

      {s.content.benefits.length > 0 && (
        <Section>
          <SectionHeader eyebrow={`Por que a ${s.brand.name}`} title="Compre com tranquilidade" />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {s.content.benefits.map((b, i) => (
              <li key={i} className="grid gap-2 rounded-[24px] bg-bg-subtle p-7">
                <span aria-hidden className="mb-3 grid size-10 place-items-center rounded-full bg-accent text-[15px] font-semibold text-accent-fg">
                  {i + 1}
                </span>
                <h3 className="text-headline">{b.title}</h3>
                {b.text && <p className="text-[15px] leading-relaxed text-muted">{b.text}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section>
        <div className="grid items-center gap-8 overflow-hidden rounded-[32px] bg-fg p-8 text-bg sm:p-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="grid gap-4">
            <Repeat aria-hidden className="size-8 opacity-80" />
            <h2 className="text-title">Seu aparelho pode valer como entrada.</h2>
            <p className="max-w-lg text-[17px] leading-relaxed opacity-75">
              Conte o modelo e o estado do seu aparelho atual. A equipe avalia e responde com uma proposta — sem compromisso.
            </p>
          </div>
          <div className="lg:justify-self-end">
            <Link href="/troca" className={buttonClass("primary", "lg")}>
              Solicitar avaliação
            </Link>
          </div>
        </div>
      </Section>

      {reviews.length > 0 && (
        <Section>
          <SectionHeader eyebrow="Avaliações" title="Quem comprou, recomenda" />
          <ul className="grid gap-3 md:grid-cols-3">
            {reviews.map((r) => (
              <li key={r.id} className="grid content-start gap-4 rounded-[24px] bg-bg-subtle p-7">
                <p className="flex gap-0.5" aria-label={`Nota ${r.rating} de 5`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} aria-hidden className={`size-4 ${i < r.rating ? "fill-current text-fg" : "text-border-strong"}`} />
                  ))}
                </p>
                <blockquote className="text-[16px] leading-relaxed">“{r.body}”</blockquote>
                <p className="text-[14px] text-muted">
                  {r.customer_name}
                  {r.source && ` · via ${r.source}`}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {s.content.faq.length > 0 && (
        <Section id="faq">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
            <SectionHeader eyebrow="Dúvidas" title="Perguntas frequentes" />
            <div className="divide-y divide-border border-y border-border">
              {s.content.faq.map((f, i) => (
                <details key={i} className="group">
                  <summary className="flex min-h-16 items-center justify-between gap-6 py-4 text-[17px] font-medium [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-bg-subtle text-[18px] transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-5 pr-12 text-[16px] leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Section>
      )}

      {s.contact.whatsapp && (
        <Section>
          <Reveal className="grid justify-items-center gap-5 py-6 text-center">
            <h2 className="text-title max-w-2xl text-balance">Prefere conversar antes de comprar?</h2>
            <p className="max-w-lg text-[17px] text-muted">Tire dúvidas, confira disponibilidade e combine a entrega direto com a equipe.</p>
            <a href={waLink(s.contact.whatsapp, `Olá, ${s.brand.name}! Vim pelo site e gostaria de atendimento.`)} target="_blank" rel="noopener" className={buttonClass("inverse", "lg", "mt-2")}>
              <MessageCircle aria-hidden className="size-5" /> Chamar no WhatsApp
            </a>
          </Reveal>
        </Section>
      )}
    </>
  );
}
