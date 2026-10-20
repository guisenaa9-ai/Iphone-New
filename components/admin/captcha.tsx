"use client";

import Script from "next/script";
import { useRef } from "react";

// Com o CAPTCHA ligado no Supabase (Attack Protection), login e recuperação de senha exigem o token do hCaptcha.
export const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

declare global {
  interface Window {
    hcaptcha?: { render: (el: HTMLElement, opts: { sitekey: string }) => string; reset: () => void };
  }
}

/** Token do widget (o hCaptcha cria o campo dentro do formulário) ou undefined. */
export const captchaToken = (f: FormData) => String(f.get("h-captcha-response") ?? "") || undefined;

/** O token só vale uma vez: chame após cada tentativa que falhar. */
export const resetCaptcha = () => window.hcaptcha?.reset();

export function Captcha() {
  const box = useRef<HTMLDivElement>(null);
  if (!HCAPTCHA_SITE_KEY) return null;
  return (
    <>
      {/* Render explícito: ao voltar do logout o script já está carregado e não redesenharia sozinho. */}
      <Script
        src="https://js.hcaptcha.com/1/api.js?render=explicit&hl=pt-BR"
        onReady={() => {
          if (box.current && !box.current.hasChildNodes()) window.hcaptcha?.render(box.current, { sitekey: HCAPTCHA_SITE_KEY });
        }}
      />
      <div ref={box} />
    </>
  );
}
