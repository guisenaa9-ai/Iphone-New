"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Toast = { id: number; text: string; tone: "success" | "error" };
const Ctx = createContext<(text: string, tone?: Toast["tone"]) => void>(() => {});

export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setList((l) => [...l.slice(-2), { id, text, tone }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3800);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4">
        {list.map((t) => (
          <div key={t.id} role="status" className="glass pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full px-4 py-2.5 text-[15px] shadow-pop ring-1 ring-border [animation:sheet-in_.35s_var(--ease)]">
            {t.tone === "success" ? <CheckCircle2 aria-hidden className="size-5 text-success" /> : <AlertCircle aria-hidden className="size-5 text-danger" />}
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
