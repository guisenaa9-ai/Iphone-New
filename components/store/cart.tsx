"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  variantId: string;
  slug: string;
  name: string;
  variant: string;
  category: string;
  colorHex: string | null;
  image: string | null;
  priceCents: number;
  stock: number;
  quantity: number;
};

type CartCtx = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotalCents: number;
  add: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  replace: (lines: CartLine[]) => void;
  clear: () => void;
};

const KEY = "cart:v1";
const MAX_PER_LINE = 10;
const Ctx = createContext<CartCtx | null>(null);

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart fora do CartProvider");
  return c;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // armazenamento indisponível (aba privada): o carrinho vive só na memória
    }
    setReady(true);
    const sync = (e: StorageEvent) => {
      if (e.key === KEY) setLines(e.newValue ? JSON.parse(e.newValue) : []);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const clamp = (q: number, stock: number) => Math.max(1, Math.min(q, stock, MAX_PER_LINE));

  const add = useCallback<CartCtx["add"]>((line, qty = 1) => {
    setLines((ls) => {
      const found = ls.find((l) => l.variantId === line.variantId);
      if (found) return ls.map((l) => (l === found ? { ...l, ...line, quantity: clamp(l.quantity + qty, line.stock) } : l));
      return [...ls, { ...line, quantity: clamp(qty, line.stock) }];
    });
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    setLines((ls) => ls.map((l) => (l.variantId === variantId ? { ...l, quantity: clamp(qty, l.stock) } : l)));
  }, []);

  const remove = useCallback((variantId: string) => setLines((ls) => ls.filter((l) => l.variantId !== variantId)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      ready,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotalCents: lines.reduce((n, l) => n + l.quantity * l.priceCents, 0),
      add,
      setQty,
      remove,
      replace: setLines,
      clear,
    }),
    [lines, ready, add, setQty, remove, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
