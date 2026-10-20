import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";
import type { StoreSettings } from "@/lib/settings";
import { waLink } from "@/lib/whatsapp";

export function Footer({ s, nav }: { s: StoreSettings; nav: { href: string; label: string }[] }) {
  const c = s.contact;
  const socials = [
    ["Instagram", c.instagram],
    ["Facebook", c.facebook],
    ["TikTok", c.tiktok],
  ].filter(([, u]) => u);
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-border bg-bg-subtle pb-28 pt-14 lg:pb-12">
      <div className="container-page grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="grid content-start gap-3">
          <p className="text-[19px] font-semibold tracking-[-0.02em]">{s.brand.name}</p>
          {s.brand.tagline && <p className="max-w-xs text-[15px] text-muted">{s.brand.tagline}</p>}
          {socials.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {socials.map(([label, href]) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener" className="inline-flex h-9 items-center rounded-full bg-surface px-4 text-[14px] ring-1 ring-border transition-colors hover:ring-border-strong">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <nav aria-label="Rodapé — loja" className="grid content-start gap-3 text-[15px]">
          <p className="text-eyebrow">Loja</p>
          {nav.map((l) => (
            <Link key={l.href} href={l.href} className="text-fg/80 hover:text-fg">
              {l.label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Rodapé — ajuda" className="grid content-start gap-3 text-[15px]">
          <p className="text-eyebrow">Ajuda</p>
          <Link href="/troca" className="text-fg/80 hover:text-fg">Avaliar meu aparelho</Link>
          <Link href="/sobre#entrega" className="text-fg/80 hover:text-fg">Entrega e retirada</Link>
          <Link href="/#faq" className="text-fg/80 hover:text-fg">Perguntas frequentes</Link>
          <Link href="/privacidade" className="text-fg/80 hover:text-fg">Privacidade</Link>
          <Link href="/termos" className="text-fg/80 hover:text-fg">Termos e trocas</Link>
        </nav>
        <address className="grid content-start gap-3 text-[15px] not-italic">
          <p className="text-eyebrow">Contato</p>
          {c.address && (
            <p className="flex gap-2">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
              {c.mapsUrl ? (
                <a href={c.mapsUrl} target="_blank" rel="noopener" className="hover:underline">{c.address}</a>
              ) : (
                c.address
              )}
            </p>
          )}
          {c.hours && (
            <p className="flex gap-2 whitespace-pre-line">
              <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
              {c.hours}
            </p>
          )}
          {c.phone && (
            <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="flex gap-2 hover:underline">
              <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" /> {c.phone}
            </a>
          )}
          {c.whatsapp && (
            <a href={waLink(c.whatsapp)} target="_blank" rel="noopener" className="hover:underline">
              WhatsApp
            </a>
          )}
          {c.email && <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a>}
        </address>
      </div>
      <div className="container-page mt-12 grid gap-2 border-t border-border pt-6 text-[13px] leading-relaxed text-muted">
        <p>
          © {year} {s.content.legalName || s.brand.name}
          {s.content.cnpj && ` · CNPJ ${s.content.cnpj}`}
        </p>
        <p>
          Loja independente, sem vínculo com a Apple Inc. iPhone, iPad, Mac, Apple Watch e AirPods são marcas da Apple Inc.,
          registradas nos EUA e em outros países.
        </p>
      </div>
    </footer>
  );
}
