import type { Metadata } from "next";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = { title: "Nova senha", robots: { index: false } };

export default function NewPassword() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg-subtle px-4">
      <NewPasswordForm />
    </main>
  );
}
