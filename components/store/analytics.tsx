"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "consent:analytics";

/** GA4 e Meta Pixel só carregam depois do consentimento (LGPD). Sem IDs configurados, nada aparece. */
export function Analytics({ ga4Id, metaPixelId }: { ga4Id: string; metaPixelId: string }) {
  const [consent, setConsent] = useState<"yes" | "no" | null | undefined>(undefined);
  useEffect(() => {
    try {
      setConsent((localStorage.getItem(KEY) as "yes" | "no" | null) ?? null);
    } catch {
      setConsent(null);
    }
  }, []);
  if (!ga4Id && !metaPixelId) return null;

  const decide = (v: "yes" | "no") => {
    try {
      localStorage.setItem(KEY, v);
    } catch {}
    setConsent(v);
  };

  return (
    <>
      {consent === null && (
        <div role="region" aria-label="Cookies" className="glass fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-[20px] p-4 text-[14px] shadow-pop ring-1 ring-border sm:flex-row sm:items-center">
          <p className="flex-1 text-muted">
            Usamos cookies de medição para melhorar a loja. <Link href="/privacidade" className="underline">Saiba mais</Link>.
          </p>
          <div className="flex gap-2">
            <button onClick={() => decide("no")} className="h-10 rounded-full px-4 ring-1 ring-border">Recusar</button>
            <button onClick={() => decide("yes")} className="h-10 rounded-full bg-fg px-4 font-medium text-bg">Aceitar</button>
          </div>
        </div>
      )}
      {consent === "yes" && ga4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga4Id}');`}
          </Script>
        </>
      )}
      {consent === "yes" && metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
