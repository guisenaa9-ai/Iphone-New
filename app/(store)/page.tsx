import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CircleCheck, MessageCircle, Repeat, Star } from "lucide-react";
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

      {/* Hero: palco escuro e centralizado, independente do tema da loja */}
      <section className="relative isolate overflow-hidden bg-black text-white">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_68%,color-mix(in_srgb,var(--accent)_28%,transparent),transparent_75%)]" />
        <div className="container-page grid justify-items-center gap-5 pb-4 pt-14 text-center sm:pt-20">
          <div className="hero-in grid justify-items-center gap-4">
            {s.hero.eyebrow && <p className="text-eyebrow text-white/60">{s.hero.eyebrow}</p>}
            <h1 className="text-display max-w-4xl text-balance">{s.hero.title}</h1>
            {s.hero.subtitle && <p className="max-w-xl text-[18px] leading-relaxed text-white/70 lg:text-[20px]">{s.hero.subtitle}</p>}
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {s.hero.primaryLabel && (
                <ButtonLink href={s.hero.primaryHref || "/catalogo"} size="lg">
                  {s.hero.primaryLabel}
                </ButtonLink>
              )}
              {s.hero.secondaryLabel && (
                <Link href={s.hero.secondaryHref || "/catalogo"} className={buttonClass("ghost", "lg", "text-white ring-1 ring-white/30 hover:bg-white/10")}>
                  {s.hero.secondaryLabel}
                </Link>
              )}
            </div>
            {heroProduct && !s.hero.imageUrl && (
              <p className="text-[14px] text-white/60">
                <Link href={`/produto/${heroProduct.slug}`} className="underline-offset-4 hover:underline">
                  {heroProduct.name}
                </Link>{" "}
                a partir de {formatBRL(cheapest(heroProduct).price_cents)}
              </p>
            )}
          </div>
          <div className="relative mt-4 aspect-[4/5] w-full max-w-[420px] sm:max-w-[480px]">
            {s.hero.imageUrl ? (
              <Image src={s.hero.imageUrl} alt="" fill priority sizes="(min-width: 640px) 480px, 90vw" className="hero-in object-contain" unoptimized={!s.hero.imageUrl.includes("/storage/v1/object/public/")} />
            ) : (
              <div className="hero-float absolute inset-x-[4%] top-[2%]">
                <PhoneArt color={heroColors[0]?.hex ?? "#3a4150"} name={heroProduct?.name} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Promoções sazonais cadastradas no painel */}
      {banners.length > 0 && (
        <section aria-label="Promoções" className="container-page pt-10">
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

      <ProductShelf title="Todos os modelos." tagline="Escolha o seu." href="/catalogo?categoria=iphone" products={featured} commerce={c} />
      <ProductShelf title="Lançamentos." tagline="Os modelos mais recentes." href="/catalogo?ordem=novidades" products={products.filter((p) => p.is_launch)} commerce={c} />
      <ProductShelf title="Mais vendidos." tagline="Os preferidos dos clientes." products={best} commerce={c} />
      <ProductShelf title="Ofertas." tagline="Preços especiais." href="/catalogo?ofertas=1" products={products.filter(onSale)} commerce={c} id="ofertas" />
      <ProductShelf title="Seminovos." tagline="Condição e bateria informadas." href="/catalogo?condicao=seminovo" products={products.filter(isUsed)} commerce={c} />
      <ProductShelf title="Acessórios." tagline="Complete o seu setup." href="/catalogo?categoria=acessorio" products={products.filter((p) => p.category === "acessorio")} commerce={c} />

      {s.content.benefits.length > 0 && (
        <Section>
          <SectionHeader title="Compre com tranquilidade." tagline={`Por que a ${s.brand.name}.`} />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {s.content.benefits.map((b, i) => (
              <li key={i} className="flex gap-4 rounded-[24px] bg-bg-subtle p-6">
                <CircleCheck aria-hidden className="mt-0.5 size-6 shrink-0 text-accent" strokeWidth={1.75} />
                <div className="grid content-start gap-1.5">
                  <h3 className="text-headline">{b.title}</h3>
                  {b.text && <p className="text-[15px] leading-relaxed text-muted">{b.text}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section>
        <div className="grid items-center gap-8 overflow-hidden rounded-[32px] bg-surface p-8 ring-1 ring-border sm:p-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="grid gap-4">
            <Repeat aria-hidden className="size-8 text-accent" />
            <h2 className="text-title">Seu aparelho pode valer como entrada.</h2>
            <p className="max-w-lg text-[17px] leading-relaxed text-muted">
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
          <SectionHeader title="Quem comprou," tagline="recomenda." />
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
            <SectionHeader title="Perguntas frequentes." tagline="Respostas rápidas." />
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
