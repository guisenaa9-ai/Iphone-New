"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Modal nativo (<dialog>): foco preso, Esc fecha e o fundo fica inerte sem biblioteca.
 * No celular vira uma folha presa à base da tela.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className={`m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-[28px] bg-surface p-0 text-fg shadow-pop sm:m-auto sm:rounded-[28px] ${wide ? "sm:max-w-4xl" : "sm:max-w-lg"}`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-surface/90 px-5 pb-2 pt-4 backdrop-blur sm:px-7 sm:pt-6">
        <h2 className="text-headline">{title}</h2>
        <button onClick={onClose} className="grid size-11 place-items-center rounded-full bg-bg-subtle transition-colors hover:bg-border" aria-label="Fechar">
          <X aria-hidden className="size-5" />
        </button>
      </div>
      <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-7 sm:pb-7">{children}</div>
    </dialog>
  );
}
