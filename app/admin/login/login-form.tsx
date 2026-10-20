"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { browserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <form
      className="grid w-full max-w-sm gap-5 rounded-[28px] bg-surface p-8 shadow-card ring-1 ring-border"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setPending(true);
        setError(null);
        const { error } = await browserClient().auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
        setPending(false);
        if (error) return setError(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : "Não foi possível entrar. Tente novamente.");
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
      {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
      <Button type="submit" size="lg" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</Button>
    </form>
  );
}
