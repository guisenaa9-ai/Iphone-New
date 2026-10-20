import { createClient } from "@supabase/supabase-js";

export const STORE_TAG = "store";

/** Leituras públicas (catálogo, configuração) sem cookies, com cache por tag. */
export function publicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 300, tags: [STORE_TAG] } }),
    },
  });
}

/** Mesma chave pública, sem cache — para pedidos e estoque em tempo real. */
export function anonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
