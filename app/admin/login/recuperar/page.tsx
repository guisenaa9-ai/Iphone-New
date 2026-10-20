import type { Metadata } from "next";
import { RecoverForm } from "./recover-form";

export const metadata: Metadata = { title: "Recuperar senha", robots: { index: false } };

export default function Recover() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg-subtle px-4">
      <RecoverForm />
    </main>
  );
}
