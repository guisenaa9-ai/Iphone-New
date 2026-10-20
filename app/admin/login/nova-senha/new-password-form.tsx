"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { browserClient } from "@/lib/supabase/browser";

const MIN_LENGTH = 12;

export function NewPasswordForm() {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "ready" | "invalid">("checking");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // O cliente troca o ?code= do link por uma sessão ao iniciar; getSession espera essa troca.
    browserClient()
      .auth.getSession()
      .then(({ data }) => setState(data.session ? "ready" : "invalid"));
  }, []);

  if (state === "checking") return <p className="text-muted">Verificando o link…</p>;
  if (state === "invalid") {
    return (
      <div className="grid w-full max-w-sm gap-5 rounded-[28px] bg-surface p-8 shadow-card ring-1 ring-border">
        <h1 className="text-headline">Link inválido ou expirado</h1>
        <p role="alert" className="text-[14px] text-muted">Peça um novo link e abra-o neste mesmo navegador.</p>
        <Link href="/admin/login/recuperar" className="justify-self-center text-[14px] underline underline-offset-4">Pedir novo link</Link>
      </div>
    );
  }
  return (
    <form
      className="grid w-full max-w-sm gap-5 rounded-[28px] bg-surface p-8 shadow-card ring-1 ring-border"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const password = String(f.get("password"));
        setError(null);
        if (password !== String(f.get("confirm"))) return setError("As senhas não são iguais.");
        setPending(true);
        const { error } = await browserClient().auth.updateUser({ password });
        setPending(false);
        if (error) {
          return setError(
            error.code === "weak_password" ? "Senha fraca. Use letras maiúsculas e minúsculas, números e símbolos."
            : error.code === "same_password" ? "A nova senha precisa ser diferente da anterior."
            : "Não foi possível salvar. Peça um novo link e tente de novo.",
          );
        }
        router.replace("/admin");
        router.refresh();
      }}
    >
      <div className="grid gap-1">
        <h1 className="text-headline">Criar nova senha</h1>
        <p className="text-[14px] text-muted">Use pelo menos {MIN_LENGTH} caracteres.</p>
      </div>
      <Field label="Nova senha" htmlFor="password"><Input id="password" name="password" type="password" required minLength={MIN_LENGTH} autoComplete="new-password" /></Field>
      <Field label="Repita a nova senha" htmlFor="confirm"><Input id="confirm" name="confirm" type="password" required minLength={MIN_LENGTH} autoComplete="new-password" /></Field>
      {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
      <Button type="submit" size="lg" disabled={pending}>{pending ? "Salvando…" : "Salvar e entrar"}</Button>
    </form>
  );
}
