import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-page grid min-h-[70dvh] place-items-center py-20 text-center">
      <div className="grid justify-items-center gap-4">
        <p className="text-eyebrow">Erro 404</p>
        <h1 className="text-title">Página não encontrada</h1>
        <p className="max-w-sm text-muted">O endereço pode ter mudado ou o produto não está mais disponível.</p>
        <Link href="/" className="mt-2 inline-flex h-11 items-center rounded-full bg-fg px-5 font-medium text-bg">Voltar ao início</Link>
      </div>
    </main>
  );
}
