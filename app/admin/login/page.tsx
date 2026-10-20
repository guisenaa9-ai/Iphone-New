import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar no painel", robots: { index: false } };

export default function Login() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg-subtle px-4">
      <LoginForm />
    </main>
  );
}
