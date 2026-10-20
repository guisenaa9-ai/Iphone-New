"use client";

import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { saveSettings } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea, Toggle } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { contrast, readableOn } from "@/lib/color";
import { FONT_OPTIONS, type StoreSettings } from "@/lib/settings";
import { ImageList } from "./image-list";

const TABS = [
  ["marca", "Marca"],
  ["contato", "Contato"],
  ["inicio", "Página inicial"],
  ["conteudo", "Conteúdo"],
  ["vendas", "Vendas"],
  ["seo", "SEO e integrações"],
] as const;

function Card({ title, children, hint }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 rounded-[24px] bg-surface p-6 ring-1 ring-border">
      <div>
        <h2 className="text-headline">{title}</h2>
        {hint && <p className="mt-1 text-[13px] text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function SettingsForm({ initial, paymentsReady }: { initial: StoreSettings; paymentsReady: boolean }) {
  const [s, setS] = useState(initial);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("marca");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  // Atualiza um campo de uma seção mantendo o resto do objeto.
  const set = <K extends keyof StoreSettings>(section: K, patch: Partial<StoreSettings[K]>) =>
    setS((cur) => ({ ...cur, [section]: { ...(cur[section] as object), ...patch } }));
  const b = s.brand, c = s.contact, h = s.hero, ct = s.content, cm = s.commerce;
  const accentText = readableOn(b.accent);
  const accentRatio = contrast(b.accent, accentText).toFixed(1);
  const single = (url: string, apply: (u: string) => void, label: string, folder: string) => (
    <ImageList label={label} value={url ? [url] : []} onChange={(v) => apply(v[0] ?? "")} folder={folder} max={1} />
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveSettings(s);
          if (!r.ok) return toast(r.error, "error");
          toast("Configurações salvas. A loja já reflete as mudanças.");
          router.refresh();
        });
      }}
      className="grid grid-cols-[minmax(0,1fr)] gap-6"
    >
      <div role="tablist" aria-label="Seções" className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`h-10 shrink-0 rounded-full px-4 text-[14px] ${tab === k ? "bg-fg text-bg" : "text-muted ring-1 ring-border hover:text-fg"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "marca" && (
        <>
          <Card title="Identidade">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Nome da loja" htmlFor="b-name"><Input id="b-name" required value={b.name} maxLength={60} onChange={(e) => set("brand", { name: e.target.value })} /></Field>
              <Field label="Frase de apresentação" htmlFor="b-tag"><Input id="b-tag" value={b.tagline} maxLength={120} onChange={(e) => set("brand", { tagline: e.target.value })} /></Field>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {single(b.logoUrl, (u) => set("brand", { logoUrl: u }), "Logotipo (fundo claro)", "brand")}
              {single(b.logoDarkUrl, (u) => set("brand", { logoDarkUrl: u }), "Logotipo para tema escuro (opcional)", "brand")}
              {single(b.faviconUrl, (u) => set("brand", { faviconUrl: u }), "Ícone da aba (favicon)", "brand")}
            </div>
            <p className="-mt-2 text-[13px] text-muted">Sem logotipo, o nome da loja aparece em texto.</p>
            <Toggle label="Mostrar o nome ao lado do logotipo" description="Para logotipos que são só um ícone, como a foto do perfil do Instagram." checked={b.logoWithName} onChange={(e) => set("brand", { logoWithName: e.target.checked })} />
          </Card>
          <Card title="Aparência" hint="A cor de destaque é usada com moderação: botões principais, selos de oferta e foco.">
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Cor de destaque" htmlFor="b-accent" hint={`Texto do botão: ${accentText === "#ffffff" ? "branco" : "escuro"} · contraste ${accentRatio}:1`}>
                <div className="flex gap-2">
                  <input type="color" value={b.accent} onChange={(e) => set("brand", { accent: e.target.value })} aria-label="Escolher cor" className="h-11 w-14 cursor-pointer rounded-[10px] ring-1 ring-border" />
                  <Input id="b-accent" value={b.accent} pattern="#[0-9a-fA-F]{6}" onChange={(e) => set("brand", { accent: e.target.value })} />
                </div>
              </Field>
              <Field label="Tipografia" htmlFor="b-font">
                <Select id="b-font" value={b.font} onChange={(e) => set("brand", { font: e.target.value as StoreSettings["brand"]["font"] })}>
                  {Object.entries(FONT_OPTIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </Select>
              </Field>
              <Field label="Tema" htmlFor="b-theme">
                <Select id="b-theme" value={b.theme} onChange={(e) => set("brand", { theme: e.target.value as StoreSettings["brand"]["theme"] })}>
                  <option value="system">Automático (segue o celular do cliente)</option>
                  <option value="light">Sempre claro</option>
                  <option value="dark">Sempre escuro</option>
                </Select>
              </Field>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {(["headerFrom", "headerTo"] as const).map((k) => (
                <Field key={k} label={k === "headerFrom" ? "Cabeçalho em degradê: cor inicial" : "Cabeçalho em degradê: cor final"} htmlFor={`b-${k}`}
                  hint={b[k] ? `Texto branco: contraste ${contrast(b[k], "#ffffff").toFixed(1)}:1${contrast(b[k], "#ffffff") < 4.5 ? " — escureça este tom" : ""}` : "Deixe as duas vazias para o cabeçalho padrão."}>
                  <div className="flex gap-2">
                    <input type="color" value={b[k] || "#1a3fd6"} onChange={(e) => set("brand", { [k]: e.target.value })} aria-label="Escolher cor" className="h-11 w-14 cursor-pointer rounded-[10px] ring-1 ring-border" />
                    <Input id={`b-${k}`} value={b[k]} placeholder="vazio" pattern="#[0-9a-fA-F]{6}" onChange={(e) => set("brand", { [k]: e.target.value })} />
                  </div>
                </Field>
              ))}
              {b.headerFrom && b.headerTo && (
                <div className="flex h-11 items-center gap-2 self-end rounded-[12px] px-4 text-[15px] font-semibold text-white" style={{ background: `linear-gradient(90deg, ${b.headerFrom}, ${b.headerTo})` }} aria-hidden>
                  {b.name}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-[16px] bg-bg-subtle p-4" style={{ fontFamily: `var(--font-${b.font})` }}>
              <span className="text-[13px] text-muted">Prévia:</span>
              <span className="inline-flex h-11 items-center rounded-full px-5 font-medium" style={{ background: b.accent, color: accentText }}>Explorar iPhones</span>
              <span className="inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-semibold" style={{ background: b.accent, color: accentText }}>Oferta</span>
              <span className="text-[20px] font-semibold tracking-[-0.02em]">{b.name}</span>
            </div>
            {Number(accentRatio) < 4.5 && <p className="text-[13px] text-warning">Contraste abaixo de 4,5:1 — o texto dos botões pode ficar difícil de ler. Escolha um tom mais escuro ou mais claro.</p>}
          </Card>
        </>
      )}

      {tab === "contato" && (
        <Card title="Contato e localização">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="WhatsApp (com 55 e DDD, só números)" htmlFor="c-wa" hint="Ex.: 5592991234567. Necessário para vender pelo WhatsApp.">
              <Input id="c-wa" inputMode="numeric" value={c.whatsapp} maxLength={13} onChange={(e) => set("contact", { whatsapp: e.target.value.replace(/\D/g, "") })} />
            </Field>
            <Field label="Telefone" htmlFor="c-phone"><Input id="c-phone" value={c.phone} maxLength={30} onChange={(e) => set("contact", { phone: e.target.value })} /></Field>
            <Field label="E-mail" htmlFor="c-email"><Input id="c-email" type="email" value={c.email} onChange={(e) => set("contact", { email: e.target.value })} /></Field>
            <Field label="Endereço" htmlFor="c-addr"><Input id="c-addr" value={c.address} maxLength={200} onChange={(e) => set("contact", { address: e.target.value })} /></Field>
            <Field label="Link do Google Maps" htmlFor="c-maps" hint="No Google Maps: Compartilhar › Copiar link."><Input id="c-maps" type="url" value={c.mapsUrl} onChange={(e) => set("contact", { mapsUrl: e.target.value })} /></Field>
            <Field label="Horário de funcionamento" htmlFor="c-hours"><Textarea id="c-hours" value={c.hours} maxLength={300} onChange={(e) => set("contact", { hours: e.target.value })} className="min-h-20" /></Field>
            <Field label="Instagram (URL)" htmlFor="c-ig"><Input id="c-ig" type="url" value={c.instagram} onChange={(e) => set("contact", { instagram: e.target.value })} /></Field>
            <Field label="Facebook (URL)" htmlFor="c-fb"><Input id="c-fb" type="url" value={c.facebook} onChange={(e) => set("contact", { facebook: e.target.value })} /></Field>
            <Field label="TikTok (URL)" htmlFor="c-tt"><Input id="c-tt" type="url" value={c.tiktok} onChange={(e) => set("contact", { tiktok: e.target.value })} /></Field>
          </div>
        </Card>
      )}

      {tab === "inicio" && (
        <>
          <Card title="Banner principal">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Chamada curta (acima do título)" htmlFor="h-eb"><Input id="h-eb" value={h.eyebrow} maxLength={60} onChange={(e) => set("hero", { eyebrow: e.target.value })} /></Field>
              <Field label="Título" htmlFor="h-title"><Input id="h-title" required value={h.title} maxLength={80} onChange={(e) => set("hero", { title: e.target.value })} /></Field>
            </div>
            <Field label="Subtítulo" htmlFor="h-sub"><Textarea id="h-sub" value={h.subtitle} maxLength={200} onChange={(e) => set("hero", { subtitle: e.target.value })} className="min-h-20" /></Field>
            <div className="grid gap-5 md:grid-cols-4">
              <Field label="Botão principal" htmlFor="h-pl"><Input id="h-pl" value={h.primaryLabel} maxLength={30} onChange={(e) => set("hero", { primaryLabel: e.target.value })} /></Field>
              <Field label="Link" htmlFor="h-ph"><Input id="h-ph" value={h.primaryHref} onChange={(e) => set("hero", { primaryHref: e.target.value })} /></Field>
              <Field label="Botão secundário" htmlFor="h-sl"><Input id="h-sl" value={h.secondaryLabel} maxLength={30} onChange={(e) => set("hero", { secondaryLabel: e.target.value })} /></Field>
              <Field label="Link" htmlFor="h-sh"><Input id="h-sh" value={h.secondaryHref} onChange={(e) => set("hero", { secondaryHref: e.target.value })} /></Field>
            </div>
            {single(h.imageUrl, (u) => set("hero", { imageUrl: u }), "Imagem do banner (opcional — sem imagem, usa a ilustração do produto em destaque)", "hero")}
          </Card>
          <Card title="Promoções sazonais" hint="Faixas que aparecem abaixo do banner principal. Defina datas para entrar e sair do ar sozinhas.">
            {s.banners.map((bn, i) => {
              const up = (patch: Partial<typeof bn>) => setS((cur) => ({ ...cur, banners: cur.banners.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
              return (
                <div key={i} className="grid gap-4 rounded-[18px] bg-bg-subtle p-4 ring-1 ring-border">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Título" htmlFor={`bn${i}t`}><Input id={`bn${i}t`} required value={bn.title} maxLength={80} onChange={(e) => up({ title: e.target.value })} placeholder="Ex.: Semana do Consumidor" /></Field>
                    <Field label="Texto" htmlFor={`bn${i}s`}><Input id={`bn${i}s`} value={bn.subtitle} maxLength={160} onChange={(e) => up({ subtitle: e.target.value })} /></Field>
                    <Field label="Link" htmlFor={`bn${i}h`}><Input id={`bn${i}h`} value={bn.href} onChange={(e) => up({ href: e.target.value })} placeholder="/catalogo?ofertas=1" /></Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Início" htmlFor={`bn${i}a`}><Input id={`bn${i}a`} type="date" value={bn.startsAt} onChange={(e) => up({ startsAt: e.target.value })} /></Field>
                      <Field label="Fim" htmlFor={`bn${i}b`}><Input id={`bn${i}b`} type="date" value={bn.endsAt} onChange={(e) => up({ endsAt: e.target.value })} /></Field>
                    </div>
                  </div>
                  {single(bn.imageUrl, (u) => up({ imageUrl: u }), "Imagem de fundo (opcional)", "banners")}
                  <div className="flex items-center justify-between">
                    <Toggle label="Ativa" checked={bn.active} onChange={(e) => up({ active: e.target.checked })} />
                    <button type="button" onClick={() => setS((cur) => ({ ...cur, banners: cur.banners.filter((_, j) => j !== i) }))} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[14px] text-danger"><Trash2 aria-hidden className="size-4" /> Remover</button>
                  </div>
                </div>
              );
            })}
            {s.banners.length < 6 && (
              <Button variant="secondary" size="sm" className="justify-self-start" onClick={() => setS((cur) => ({ ...cur, banners: [...cur.banners, { title: "", subtitle: "", imageUrl: "", href: "", startsAt: "", endsAt: "", active: true }] }))}>
                <Plus aria-hidden className="size-4" /> Promoção
              </Button>
            )}
          </Card>
        </>
      )}

      {tab === "conteudo" && (
        <>
          <Card title="Sobre a loja">
            <Field label="Texto institucional" htmlFor="ct-about"><Textarea id="ct-about" value={ct.about} maxLength={3000} onChange={(e) => set("content", { about: e.target.value })} className="min-h-40" /></Field>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Razão social" htmlFor="ct-legal"><Input id="ct-legal" value={ct.legalName} maxLength={120} onChange={(e) => set("content", { legalName: e.target.value })} /></Field>
              <Field label="CNPJ" htmlFor="ct-cnpj" hint="Exibido no rodapé e nos termos (exigência do Decreto 7.962/2013)."><Input id="ct-cnpj" value={ct.cnpj} maxLength={20} onChange={(e) => set("content", { cnpj: e.target.value })} /></Field>
            </div>
            <Toggle label="Aviso de loja de demonstração" description="Mostra uma faixa informando que preços e estoque são ilustrativos. Desligue ao lançar a loja real." checked={ct.demoNotice} onChange={(e) => set("content", { demoNotice: e.target.checked })} />
          </Card>
          <ListEditor
            title="Benefícios"
            hint="Diferenciais reais da loja. Não prometa garantia, frete ou desconto que a loja não oferece."
            items={ct.benefits}
            max={6}
            empty={{ title: "", text: "" }}
            onChange={(benefits) => set("content", { benefits })}
            render={(it, up, i) => (
              <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
                <Input aria-label={`Benefício ${i + 1}: título`} required value={it.title} maxLength={60} placeholder="Título" onChange={(e) => up({ title: e.target.value })} />
                <Input aria-label={`Benefício ${i + 1}: texto`} value={it.text} maxLength={200} placeholder="Descrição curta" onChange={(e) => up({ text: e.target.value })} />
              </div>
            )}
          />
          <ListEditor
            title="Perguntas frequentes"
            items={ct.faq}
            max={16}
            empty={{ q: "", a: "" }}
            onChange={(faq) => set("content", { faq })}
            render={(it, up, i) => (
              <div className="grid gap-3">
                <Input aria-label={`Pergunta ${i + 1}`} required value={it.q} maxLength={160} placeholder="Pergunta" onChange={(e) => up({ q: e.target.value })} />
                <Textarea aria-label={`Resposta ${i + 1}`} required value={it.a} maxLength={1200} placeholder="Resposta" onChange={(e) => up({ a: e.target.value })} className="min-h-20" />
              </div>
            )}
          />
        </>
      )}

      {tab === "vendas" && (
        <>
          <Card title="Como a loja vende">
            <Field label="Finalização de pedidos" htmlFor="cm-mode">
              <Select id="cm-mode" value={cm.salesMode} onChange={(e) => set("commerce", { salesMode: e.target.value as StoreSettings["commerce"]["salesMode"] })}>
                <option value="whatsapp">Somente WhatsApp</option>
                <option value="online">Somente pagamento online</option>
                <option value="both">WhatsApp e pagamento online</option>
              </Select>
            </Field>
            <p className={`text-[13px] ${paymentsReady ? "text-success" : "text-warning"}`}>
              {paymentsReady ? "Mercado Pago configurado no servidor." : "Pagamento online indisponível: as chaves do Mercado Pago não estão configuradas no servidor (veja o README). Enquanto isso, só o WhatsApp aparece."}
            </p>
            {cm.salesMode !== "online" && c.whatsapp.length < 12 && <p className="text-[13px] text-warning">Cadastre o WhatsApp na aba Contato para vender por lá.</p>}
            <div className="grid gap-x-8 md:grid-cols-2">
              <div className="grid gap-3">
                <Toggle label="Retirada na loja" checked={cm.pickupEnabled} onChange={(e) => set("commerce", { pickupEnabled: e.target.checked })} />
                <Field label="Informação de retirada" htmlFor="cm-pick"><Input id="cm-pick" value={cm.pickupInfo} maxLength={300} onChange={(e) => set("commerce", { pickupInfo: e.target.value })} /></Field>
              </div>
              <div className="grid gap-3">
                <Toggle label="Entrega local" description="Bairros e taxas em Entregas." checked={cm.deliveryEnabled} onChange={(e) => set("commerce", { deliveryEnabled: e.target.checked })} />
                <Field label="Informação de entrega" htmlFor="cm-deliv"><Input id="cm-deliv" value={cm.deliveryInfo} maxLength={300} onChange={(e) => set("commerce", { deliveryInfo: e.target.value })} /></Field>
              </div>
            </div>
            <Field label="Formas de pagamento (texto exibido no produto e no checkout)" htmlFor="cm-pay"><Input id="cm-pay" value={cm.paymentInfo} maxLength={300} onChange={(e) => set("commerce", { paymentInfo: e.target.value })} placeholder="Ex.: Pix e cartão de crédito" /></Field>
          </Card>
          <Card title="Parcelamento" hint="Defina as condições reais da loja. Com máximo 1x, o parcelamento não é exibido.">
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Máximo de parcelas" htmlFor="cm-max"><Input id="cm-max" type="number" min={1} max={24} value={cm.installmentsMax} onChange={(e) => set("commerce", { installmentsMax: Number(e.target.value) || 1 })} /></Field>
              <Field label="Sem juros até" htmlFor="cm-free"><Input id="cm-free" type="number" min={1} max={24} value={cm.installmentsInterestFree} onChange={(e) => set("commerce", { installmentsInterestFree: Number(e.target.value) || 1 })} /></Field>
              <Field label="Juros ao mês acima disso (%)" htmlFor="cm-rate"><Input id="cm-rate" type="number" min={0} max={15} step={0.01} value={cm.installmentsMonthlyRate} onChange={(e) => set("commerce", { installmentsMonthlyRate: Number(e.target.value) || 0 })} /></Field>
            </div>
          </Card>
          <Card title="Pedidos e estoque">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Prefixo do código do pedido" htmlFor="cm-prefix" hint={`Ex.: ${cm.orderPrefix || "PED"}-1001`}><Input id="cm-prefix" value={cm.orderPrefix} maxLength={6} onChange={(e) => set("commerce", { orderPrefix: e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase() })} /></Field>
              <Field label="Alerta de estoque baixo (unidades)" htmlFor="cm-low"><Input id="cm-low" type="number" min={0} max={100} value={cm.lowStockThreshold} onChange={(e) => set("commerce", { lowStockThreshold: Number(e.target.value) || 0 })} /></Field>
            </div>
          </Card>
        </>
      )}

      {tab === "seo" && (
        <>
          <Card title="Busca e compartilhamento" hint="Como a loja aparece no Google e em links do WhatsApp e Instagram.">
            <Field label="Título" htmlFor="seo-t" hint={`${s.seo.title.length}/70`}><Input id="seo-t" value={s.seo.title} maxLength={70} onChange={(e) => set("seo", { title: e.target.value })} /></Field>
            <Field label="Descrição" htmlFor="seo-d" hint={`${s.seo.description.length}/170`}><Textarea id="seo-d" value={s.seo.description} maxLength={170} onChange={(e) => set("seo", { description: e.target.value })} className="min-h-20" /></Field>
            {single(s.seo.ogImageUrl, (u) => set("seo", { ogImageUrl: u }), "Imagem de compartilhamento (1200×630)", "seo")}
          </Card>
          <Card title="Medição (opcional)" hint="Só carregam se o visitante aceitar cookies (LGPD).">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Google Analytics 4 — ID" htmlFor="an-ga"><Input id="an-ga" value={s.analytics.ga4Id} placeholder="G-XXXXXXX" onChange={(e) => set("analytics", { ga4Id: e.target.value.trim().toUpperCase() })} /></Field>
              <Field label="Meta Pixel — ID" htmlFor="an-px"><Input id="an-px" inputMode="numeric" value={s.analytics.metaPixelId} onChange={(e) => set("analytics", { metaPixelId: e.target.value.replace(/\D/g, "") })} /></Field>
            </div>
          </Card>
        </>
      )}

      <div className="glass sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-border px-4 py-3 sm:-mx-8 sm:px-8">
        <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar alterações"}</Button>
      </div>
    </form>
  );
}

function ListEditor<T>({ title, hint, items, max, empty, onChange, render }: {
  title: string;
  hint?: string;
  items: T[];
  max: number;
  empty: T;
  onChange: (v: T[]) => void;
  render: (item: T, update: (patch: Partial<T>) => void, i: number) => ReactNode;
}) {
  return (
    <Card title={title} hint={hint}>
      {items.map((it, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">{render(it, (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))), i)}</div>
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="grid size-11 shrink-0 place-items-center rounded-full text-danger hover:bg-bg-subtle" aria-label={`Remover item ${i + 1}`}><Trash2 className="size-4" /></button>
        </div>
      ))}
      {items.length < max && (
        <Button variant="secondary" size="sm" className="justify-self-start" onClick={() => onChange([...items, { ...empty }])}>
          <Plus aria-hidden className="size-4" /> Adicionar
        </Button>
      )}
    </Card>
  );
}
