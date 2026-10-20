"use client";

import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { useActionState } from "react";
import { submitTradeIn, type TradeInState } from "@/app/(store)/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";

export function TradeInForm() {
  const [state, action, pending] = useActionState<TradeInState, FormData>(submitTradeIn, null);
  if (state?.ok) {
    return (
      <div role="status" className="grid justify-items-center gap-4 rounded-[24px] bg-bg-subtle p-10 text-center">
        <CheckCircle2 aria-hidden className="size-10 text-success" />
        <h2 className="text-headline">Pedido de avaliação enviado</h2>
        <p className="max-w-sm text-muted">A equipe vai responder pelo celular informado. Se quiser agilizar, envie fotos do aparelho pelo WhatsApp.</p>
        {state.whatsappUrl && (
          <a href={state.whatsappUrl} target="_blank" rel="noopener" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1f9d55] px-5 font-medium text-white">
            <MessageCircle aria-hidden className="size-5" /> Enviar fotos no WhatsApp
          </a>
        )}
      </div>
    );
  }
  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Seu nome" htmlFor="ti-name"><Input id="ti-name" name="name" required minLength={2} maxLength={80} autoComplete="name" /></Field>
        <Field label="Celular com DDD" htmlFor="ti-phone"><Input id="ti-phone" name="phone" required inputMode="tel" autoComplete="tel-national" placeholder="(92) 99999-9999" maxLength={20} /></Field>
        <Field label="Modelo do aparelho" htmlFor="ti-model"><Input id="ti-model" name="device_model" required maxLength={80} placeholder="Ex.: iPhone 13 Pro" /></Field>
        <Field label="Armazenamento" htmlFor="ti-storage"><Input id="ti-storage" name="storage" maxLength={20} placeholder="Ex.: 256 GB" /></Field>
        <Field label="Saúde da bateria (%)" htmlFor="ti-battery" hint="Em Ajustes › Bateria › Saúde e Carregamento"><Input id="ti-battery" name="battery_health" type="number" min={1} max={100} inputMode="numeric" /></Field>
        <Field label="Interesse em (opcional)" htmlFor="ti-desired"><Input id="ti-desired" name="desired_product" maxLength={120} placeholder="Ex.: iPhone 16 Pro" /></Field>
      </div>
      <Field label="Estado do aparelho" htmlFor="ti-cond" hint="Riscos, trincas, reparos anteriores, peças trocadas, se acompanha caixa e carregador.">
        <Textarea id="ti-cond" name="device_condition" required minLength={2} maxLength={1000} />
      </Field>
      <label className="flex items-start gap-3 text-[14px] text-muted">
        <input type="checkbox" name="privacy" required className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
        <span>Autorizo o contato da loja sobre esta avaliação, conforme a <Link href="/privacidade" className="underline">política de privacidade</Link>.</span>
      </label>
      {state?.error && <p role="alert" className="rounded-[12px] bg-danger/10 px-4 py-3 text-[14px] text-danger">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending} className="sm:justify-self-start">{pending ? "Enviando…" : "Solicitar avaliação"}</Button>
    </form>
  );
}
