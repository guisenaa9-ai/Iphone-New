"use client";

import { Plus, Star, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteReview, deleteZone, saveReview, saveZone, setTradeInStatus, type ActionResult } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea, Toggle } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { formatBRL, parseMoney } from "@/lib/money";

function useRun() {
  const [pending, start] = useTransition();
  const toast = useToast();
  const run = (fn: () => Promise<ActionResult>, ok: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast(ok);
        after?.();
      } else toast(r.error, "error");
    });
  return { pending, run };
}

type Zone = { id: string; name: string; fee_cents: number; eta: string; is_active: boolean; sort_order: number };

export function ZonesEditor({ zones }: { zones: Zone[] }) {
  const { pending, run } = useRun();
  const [draft, setDraft] = useState({ name: "", fee: "", eta: "" });
  return (
    <div className="grid gap-6">
      <ul className="grid gap-3">
        {zones.map((z) => <ZoneRow key={z.id} zone={z} />)}
        {!zones.length && <li className="text-[15px] text-muted">Nenhum bairro cadastrado.</li>}
      </ul>
      <form
        className="grid gap-4 rounded-[20px] bg-surface p-5 ring-1 ring-border md:grid-cols-[2fr_1fr_1.5fr_auto] md:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => saveZone({ name: draft.name, fee_cents: parseMoney(draft.fee) ?? 0, eta: draft.eta, sort_order: zones.length + 1 }), "Bairro adicionado", () => setDraft({ name: "", fee: "", eta: "" }));
        }}
      >
        <Field label="Bairro ou região" htmlFor="z-name"><Input id="z-name" required value={draft.name} maxLength={80} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <Field label="Taxa (R$)" htmlFor="z-fee"><Input id="z-fee" inputMode="decimal" value={draft.fee} placeholder="0,00" onChange={(e) => setDraft({ ...draft, fee: e.target.value })} /></Field>
        <Field label="Prazo" htmlFor="z-eta"><Input id="z-eta" value={draft.eta} maxLength={60} placeholder="Ex.: no mesmo dia" onChange={(e) => setDraft({ ...draft, eta: e.target.value })} /></Field>
        <Button type="submit" disabled={pending}><Plus aria-hidden className="size-4" /> Adicionar</Button>
      </form>
    </div>
  );
}

function ZoneRow({ zone }: { zone: Zone }) {
  const { pending, run } = useRun();
  const [z, setZ] = useState({ ...zone, fee: (zone.fee_cents / 100).toFixed(2).replace(".", ",") });
  const save = (patch: Partial<typeof z> = {}) => {
    const next = { ...z, ...patch };
    setZ(next);
    run(() => saveZone({ id: next.id, name: next.name, fee_cents: parseMoney(next.fee) ?? 0, eta: next.eta, is_active: next.is_active, sort_order: next.sort_order }), "Bairro atualizado");
  };
  return (
    <li className="grid gap-3 rounded-[16px] bg-surface p-4 ring-1 ring-border md:grid-cols-[2fr_1fr_1.5fr_auto_auto] md:items-center" aria-busy={pending}>
      <Input aria-label="Bairro" value={z.name} onChange={(e) => setZ({ ...z, name: e.target.value })} onBlur={() => z.name !== zone.name && save()} />
      <Input aria-label="Taxa" inputMode="decimal" value={z.fee} onChange={(e) => setZ({ ...z, fee: e.target.value })} onBlur={() => parseMoney(z.fee) !== zone.fee_cents && save()} />
      <Input aria-label="Prazo" value={z.eta} onChange={(e) => setZ({ ...z, eta: e.target.value })} onBlur={() => z.eta !== zone.eta && save()} />
      <Toggle label="Ativo" checked={z.is_active} onChange={(e) => save({ is_active: e.target.checked })} />
      <button type="button" onClick={() => confirm(`Excluir ${zone.name}?`) && run(() => deleteZone(zone.id), "Bairro excluído")} className="grid size-11 place-items-center rounded-full text-danger hover:bg-bg-subtle" aria-label={`Excluir ${zone.name}`}><Trash2 className="size-4" /></button>
      <span className="sr-only">Taxa atual {formatBRL(zone.fee_cents)}</span>
    </li>
  );
}

type Review = { id: string; customer_name: string; rating: number; body: string; source: string; is_published: boolean };

export function ReviewsEditor({ reviews }: { reviews: Review[] }) {
  const { pending, run } = useRun();
  const empty = { customer_name: "", rating: 5, body: "", source: "", is_published: false };
  const [draft, setDraft] = useState(empty);
  return (
    <div className="grid gap-6">
      <form
        className="grid gap-4 rounded-[20px] bg-surface p-5 ring-1 ring-border"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => saveReview(draft), "Avaliação salva", () => setDraft(empty));
        }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Nome do cliente" htmlFor="r-name"><Input id="r-name" required value={draft.customer_name} maxLength={80} onChange={(e) => setDraft({ ...draft, customer_name: e.target.value })} /></Field>
          <Field label="Nota" htmlFor="r-rating">
            <Select id="r-rating" value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} {n === 1 ? "estrela" : "estrelas"}</option>)}
            </Select>
          </Field>
          <Field label="Origem" htmlFor="r-src"><Input id="r-src" value={draft.source} maxLength={40} placeholder="Ex.: Google" onChange={(e) => setDraft({ ...draft, source: e.target.value })} /></Field>
        </div>
        <Field label="Texto" htmlFor="r-body"><Textarea id="r-body" required value={draft.body} maxLength={1000} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></Field>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Toggle label="Publicar na loja" checked={draft.is_published} onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })} />
          <Button type="submit" disabled={pending}>Adicionar avaliação</Button>
        </div>
      </form>
      <ul className="grid gap-3">
        {reviews.map((r) => (
          <li key={r.id} className="grid gap-2 rounded-[16px] bg-surface p-5 ring-1 ring-border">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium">
                {r.customer_name} <span className="inline-flex align-middle" aria-label={`${r.rating} de 5`}>{Array.from({ length: r.rating }, (_, i) => <Star key={i} aria-hidden className="size-3.5 fill-current" />)}</span>
                {r.source && <span className="text-[13px] font-normal text-muted"> · {r.source}</span>}
              </p>
              <div className="flex items-center gap-2">
                <Toggle label="Publicada" checked={r.is_published} onChange={(e) => run(() => saveReview({ ...r, is_published: e.target.checked }), e.target.checked ? "Publicada" : "Ocultada")} />
                <button type="button" onClick={() => confirm("Excluir esta avaliação?") && run(() => deleteReview(r.id), "Avaliação excluída")} className="grid size-11 place-items-center rounded-full text-danger hover:bg-bg-subtle" aria-label="Excluir avaliação"><Trash2 className="size-4" /></button>
              </div>
            </div>
            <p className="text-[15px] text-muted">{r.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TradeInStatus({ id, status }: { id: string; status: string }) {
  const { pending, run } = useRun();
  return (
    <Select aria-label="Status da solicitação" value={status} disabled={pending} onChange={(e) => run(() => setTradeInStatus(id, e.target.value), "Status atualizado")} className="h-9 w-40 text-[14px]">
      <option value="new">Nova</option>
      <option value="contacted">Em contato</option>
      <option value="closed">Encerrada</option>
    </Select>
  );
}
