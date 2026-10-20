"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { browserClient } from "@/lib/supabase/browser";

// Com o CAPTCHA ligado no Supabase (Attack Protection), o login exige o token do hCaptcha.
const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

declare global {
  interface Window {
    hcaptcha?: { render: (el: HTMLElement, opts: { sitekey: string }) => string; reset: () => void };
  }
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const captchaBox = useRef<HTMLDivElement>(null);
  return (
    <form
      className="grid w-full max-w-sm gap-5 rounded-[28px] bg-surface p-8 shadow-card ring-1 ring-border"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setPending(true);
        setError(null);
        const captchaToken = String(f.get("h-captcha-response") ?? "") || undefined; // campo criado pelo widget
        if (HCAPTCHA_SITE_KEY && !captchaToken) {
          setPending(false);
          return setError("Confirme que você não é um robô.");
        }
        const { error } = await browserClient().auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")), options: { captchaToken } });
        setPending(false);
        if (error) {
          window.hcaptcha?.reset(); // o token só vale uma vez
          return setError(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : "Não foi possível entrar. Tente novamente.");
        }
        router.replace("/admin");
        router.refresh();
      }}
    >
      <div className="grid gap-1">
        <h1 className="text-headline">Painel da loja</h1>
        <p className="text-[14px] text-muted">Entre com a conta de administrador.</p>
      </div>
      <Field label="E-mail" htmlFor="email"><Input id="email" name="email" type="email" required autoComplete="username" /></Field>
      <Field label="Senha" htmlFor="password"><Input id="password" name="password" type="password" required autoComplete="current-password" /></Field>
      {HCAPTCHA_SITE_KEY && (
        <>
          {/* Render explícito: ao voltar do logout o script já está carregado e não redesenharia sozinho. */}
          <Script
            src="https://js.hcaptcha.com/1/api.js?render=explicit&hl=pt-BR"
            onReady={() => {
              if (captchaBox.current && !captchaBox.current.hasChildNodes()) window.hcaptcha?.render(captchaBox.current, { sitekey: HCAPTCHA_SITE_KEY });
            }}
          />
          <div ref={captchaBox} />
        </>
      )}
      {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
      <Button type="submit" size="lg" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</Button>
    </form>
  );
}
