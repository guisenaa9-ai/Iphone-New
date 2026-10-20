"use client";

import { useRouter } from "next/navigation";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { saveProduct } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea, Toggle } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { CATEGORY_LABEL, CONDITION_LABEL, type Condition, type Product } from "@/lib/catalog";
import { parseMoney } from "@/lib/money";
import { ImageList } from "./image-list";

type V = {
  id?: string;
  sku: string;
  color_name: string;
  color_hex: string;
  storage: string;
  condition: Condition;
  battery_health: string;
  price: string;
  compare_at: string;
  stock: string;
  images: string[];
  is_active: boolean;
};

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

const money = (c: number | null | undefined) => (c ? (c / 100).toFixed(2).replace(".", ",") : "");

const blank: V = { sku: "", color_name: "", color_hex: "#3a3a3c", storage: "", condition: "novo", battery_health: "", price: "", compare_at: "", stock: "0", images: [], is_active: true };

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [category, setCategory] = useState<Product["category"]>(product?.category ?? "iphone");
  const [family, setFamily] = useState(product?.family ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [warranty, setWarranty] = useState(product?.warranty ?? "");
  const [sort, setSort] = useState(String(product?.sort_order ?? 0));
  const [flags, setFlags] = useState({ is_active: product?.is_active ?? true, is_featured: product?.is_featured ?? false, is_launch: product?.is_launch ?? false });
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [specs, setSpecs] = useState(product?.specs ?? []);
  const [variants, setVariants] = useState<V[]>(
    product?.variants.length
      ? [...product.variants]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((v) => ({
            id: v.id,
            sku: v.sku ?? "",
            color_name: v.color_name ?? "",
            color_hex: v.color_hex ?? "#3a3a3c",
            storage: v.storage ?? "",
            condition: v.condition,
            battery_health: v.battery_health ? String(v.battery_health) : "",
            price: money(v.price_cents),
            compare_at: money(v.compare_at_cents),
            stock: String(v.stock),
            images: v.images,
            is_active: v.is_active,
          }))
      : [{ ...blank }],
  );

  const setV = (i: number, patch: Partial<V>) => setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  const submit = () =>
    start(async () => {
      const res = await saveProduct({
        id: product?.id,
        slug,
        name,
        category,
        family,
        description,
        warranty,
        sort_order: Number(sort) || 0,
        ...flags,
        images,
        specs: specs.filter((s) => s.label.trim() && s.value.trim()),
        variants: variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          color_name: v.color_name,
          color_hex: v.color_name ? v.color_hex : "",
          storage: v.storage,
          condition: v.condition,
          battery_health: v.condition !== "novo" && v.battery_health ? Number(v.battery_health) : "",
          price_cents: parseMoney(v.price) ?? 0,
          compare_at_cents: parseMoney(v.compare_at),
          stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
          images: v.images,
          is_active: v.is_active,
        })),
      });
      if (!res.ok) return toast(res.error, "error");
      toast("Produto salvo");
      if (!product) router.replace(`/admin/produtos/${res.id}`);
      router.refresh();
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid grid-cols-[minmax(0,1fr)] gap-8"
    >
      <section className="grid gap-5 rounded-[24px] bg-surface p-6 ring-1 ring-border">
        <h2 className="text-headline">Informações</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nome" htmlFor="p-name">
            <Input id="p-name" required value={name} maxLength={120} onChange={(e) => (setName(e.target.value), !slugTouched && setSlug(slugify(e.target.value)))} placeholder="Ex.: iPhone 16 Pro" />
          </Field>
          <Field label="Endereço na loja" htmlFor="p-slug" hint={`/produto/${slug || "…"}`}>
            <Input id="p-slug" required value={slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={(e) => (setSlugTouched(true), setSlug(slugify(e.target.value)))} />
          </Field>
          <Field label="Categoria" htmlFor="p-cat">
            <Select id="p-cat" value={category} onChange={(e) => setCategory(e.target.value as Product["category"])}>
              {Object.entries(CATEGORY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Linha / geração (filtro)" htmlFor="p-family" hint="Ex.: iPhone 16 Pro. Produtos com a mesma linha aparecem juntos.">
            <Input id="p-family" value={family} maxLength={40} onChange={(e) => setFamily(e.target.value)} />
          </Field>
        </div>
        <Field label="Descrição" htmlFor="p-desc"><Textarea id="p-desc" value={description} maxLength={3000} onChange={(e) => setDescription(e.target.value)} /></Field>
        <Field label="Garantia" htmlFor="p-warranty" hint="Exatamente como a loja oferece. Deixe vazio para não exibir.">
          <Input id="p-warranty" value={warranty} maxLength={300} onChange={(e) => setWarranty(e.target.value)} />
        </Field>
        <div className="grid gap-x-8 md:grid-cols-3">
          <Toggle label="Ativo na loja" checked={flags.is_active} onChange={(e) => setFlags({ ...flags, is_active: e.target.checked })} />
          <Toggle label="Destaque na página inicial" checked={flags.is_featured} onChange={(e) => setFlags({ ...flags, is_featured: e.target.checked })} />
          <Toggle label="Lançamento" checked={flags.is_launch} onChange={(e) => setFlags({ ...flags, is_launch: e.target.checked })} />
        </div>
        <Field label="Ordem de exibição" htmlFor="p-sort" hint="Menor aparece primeiro." className="max-w-40">
          <Input id="p-sort" type="number" min={0} max={9999} value={sort} onChange={(e) => setSort(e.target.value)} />
        </Field>
      </section>

      <section className="grid gap-5 rounded-[24px] bg-surface p-6 ring-1 ring-border">
        <ImageList label="Fotos do produto (usadas quando a variante não tem fotos próprias)" value={images} onChange={setImages} folder="products" />
      </section>

      <section className="grid gap-5 rounded-[24px] bg-surface p-6 ring-1 ring-border">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-headline">Variantes</h2>
          <Button size="sm" variant="secondary" onClick={() => setVariants((vs) => [...vs, { ...blank }])}><Plus aria-hidden className="size-4" /> Variante</Button>
        </div>
        <p className="-mt-3 text-[13px] text-muted">Cada combinação de armazenamento, cor e condição tem preço e estoque próprios.</p>
        <ol className="grid gap-4">
          {variants.map((v, i) => {
            const id = (k: string) => `v${i}-${k}`;
            return (
              <li key={v.id ?? `new-${i}`} className="grid gap-4 rounded-[18px] bg-bg-subtle p-4 ring-1 ring-border">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[14px] font-semibold">#{i + 1} {[v.storage, v.color_name, v.condition !== "novo" && CONDITION_LABEL[v.condition]].filter(Boolean).join(" · ")}</p>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setVariants((vs) => [...vs.slice(0, i + 1), { ...v, id: undefined, sku: "" }, ...vs.slice(i + 1)])} className="grid size-9 place-items-center rounded-full hover:bg-surface" aria-label={`Duplicar variante ${i + 1}`}><Copy className="size-4" /></button>
                    <button type="button" disabled={variants.length === 1} onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))} className="grid size-9 place-items-center rounded-full text-danger hover:bg-surface disabled:opacity-30" aria-label={`Remover variante ${i + 1}`}><Trash2 className="size-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Field label="Armazenamento" htmlFor={id("st")}><Input id={id("st")} value={v.storage} maxLength={20} placeholder="128 GB" onChange={(e) => setV(i, { storage: e.target.value })} /></Field>
                  <Field label="Cor" htmlFor={id("cn")}>
                    <div className="flex gap-2">
                      <input type="color" value={v.color_hex} onChange={(e) => setV(i, { color_hex: e.target.value })} aria-label="Tom da cor" className="h-11 w-11 shrink-0 cursor-pointer rounded-[10px] bg-surface ring-1 ring-border" />
                      <Input id={id("cn")} value={v.color_name} maxLength={40} placeholder="Preto" onChange={(e) => setV(i, { color_name: e.target.value })} />
                    </div>
                  </Field>
                  <Field label="Condição" htmlFor={id("cd")}>
                    <Select id={id("cd")} value={v.condition} onChange={(e) => setV(i, { condition: e.target.value as Condition })}>
                      {Object.entries(CONDITION_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </Select>
                  </Field>
                  {v.condition !== "novo" ? (
                    <Field label="Saúde da bateria (%)" htmlFor={id("bh")}><Input id={id("bh")} type="number" min={1} max={100} value={v.battery_health} onChange={(e) => setV(i, { battery_health: e.target.value })} /></Field>
                  ) : (
                    <Field label="SKU (opcional)" htmlFor={id("sku")}><Input id={id("sku")} value={v.sku} maxLength={60} onChange={(e) => setV(i, { sku: e.target.value })} /></Field>
                  )}
                  <Field label="Preço (R$)" htmlFor={id("pr")}><Input id={id("pr")} required inputMode="decimal" value={v.price} placeholder="6.799,00" onChange={(e) => setV(i, { price: e.target.value })} /></Field>
                  <Field label="Preço “de” (oferta)" htmlFor={id("ca")} hint="Opcional; maior que o preço."><Input id={id("ca")} inputMode="decimal" value={v.compare_at} onChange={(e) => setV(i, { compare_at: e.target.value })} /></Field>
                  <Field label="Estoque" htmlFor={id("sk")}><Input id={id("sk")} type="number" min={0} max={99999} required value={v.stock} onChange={(e) => setV(i, { stock: e.target.value })} /></Field>
                  <div className="flex items-end"><Toggle label="Ativa" checked={v.is_active} onChange={(e) => setV(i, { is_active: e.target.checked })} /></div>
                </div>
                <details>
                  <summary className="text-[13px] text-muted">Fotos específicas desta variante ({v.images.length})</summary>
                  <div className="pt-3"><ImageList label="Fotos da variante" value={v.images} onChange={(images) => setV(i, { images })} folder="products" /></div>
                </details>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="grid gap-4 rounded-[24px] bg-surface p-6 ring-1 ring-border">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-headline">Especificações técnicas</h2>
          <Button size="sm" variant="secondary" onClick={() => setSpecs((s) => [...s, { label: "", value: "" }])}><Plus aria-hidden className="size-4" /> Linha</Button>
        </div>
        {specs.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
            <Input aria-label={`Especificação ${i + 1}: nome`} value={s.label} maxLength={40} placeholder="Tela" onChange={(e) => setSpecs((xs) => xs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <Input aria-label={`Especificação ${i + 1}: valor`} value={s.value} maxLength={200} placeholder={'6,1" Super Retina XDR'} onChange={(e) => setSpecs((xs) => xs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
            <button type="button" onClick={() => setSpecs((xs) => xs.filter((_, j) => j !== i))} className="grid size-11 place-items-center rounded-full text-danger hover:bg-bg-subtle" aria-label={`Remover especificação ${i + 1}`}><Trash2 className="size-4" /></button>
          </div>
        ))}
      </section>

      <div className="glass sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-border px-4 py-3 sm:-mx-8 sm:px-8">
        <Button variant="secondary" onClick={() => router.push("/admin/produtos")}>Cancelar</Button>
        <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar produto"}</Button>
      </div>
    </form>
  );
}
