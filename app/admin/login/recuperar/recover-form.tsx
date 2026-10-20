"use client";

import Link from "next/link";
import { useState } from "react";
import { Captcha, captchaToken, HCAPTCHA_SITE_KEY, resetCaptcha } from "@/components/admin/captcha";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { browserClient } from "@/lib/supabase/browser";

export function RecoverForm() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const back = (
    <Link href="/admin/login" className="justify-self-center text-[14px] text-muted underline-offset-4 hover:text-fg hover:underline">
      Voltar para o login
    </Link>
  );
  if (sent) {
    return (
      <div className="grid w-full max-w-sm gap-5 rounded-[28px] bg-surface p-8 shadow-card ring-1 ring-border">
        <h1 className="text-headline">Confira seu e-mail</h1>
        <p role="status" className="text-[14px] text-muted">
          Se o e-mail for de um administrador, você vai receber um link para criar uma nova senha. Abra o link neste mesmo navegador. Ele vale por 1 hora.
        </p>
        {back}
      </div>
    );
  }
  return (
    <form
      className="grid w-full max-w-sm gap-5 rounded-[28px] bg-surface p-8 shadow-card ring-1 ring-border"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setError(null);
        const token = captchaToken(f);
        if (HCAPTCHA_SITE_KEY && !token) return setError("Confirme que você não é um robô.");
        setPending(true);
        const { error } = await browserClient().auth.resetPasswordForEmail(String(f.get("email")), {
          redirectTo: `${window.location.origin}/admin/login/nova-senha`,
          captchaToken: token,
        });
        setPending(false);
        // Mesma resposta para e-mail cadastrado ou não: a tela não revela quem é admin.
        if (!error) return setSent(true);
        resetCaptcha();
        setError(error.status === 429 ? "Muitos pedidos seguidos. Aguarde alguns minutos e tente de novo." : "Não foi possível enviar agora. Tente novamente.");
      }}
    >
      <div className="grid gap-1">
        <h1 className="text-headline">Recuperar senha</h1>
        <p className="text-[14px] text-muted">Informe o e-mail da conta de administrador.</p>
      </div>
      <Field label="E-mail" htmlFor="email"><Input id="email" name="email" type="email" required autoComplete="username" /></Field>
      <Captcha />
      {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
      <Button type="submit" size="lg" disabled={pending}>{pending ? "Enviando…" : "Enviar link"}</Button>
      {back}
    </form>
  );
}
