import type { StoreSettings } from "./settings";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const formatBRL = (cents: number) => brl.format(cents / 100);

export type InstallmentOption = { count: number; perCents: number; totalCents: number; interestFree: boolean };

/** Parcelas conforme as regras que a própria loja definiu no painel. */
export function installmentOptions(priceCents: number, c: StoreSettings["commerce"]): InstallmentOption[] {
  const out: InstallmentOption[] = [];
  const rate = c.installmentsMonthlyRate / 100;
  for (let n = 2; n <= c.installmentsMax; n++) {
    const free = n <= c.installmentsInterestFree || rate === 0;
    const per = free ? priceCents / n : (priceCents * rate) / (1 - Math.pow(1 + rate, -n));
    const perCents = Math.ceil(per);
    out.push({ count: n, perCents, totalCents: free ? priceCents : perCents * n, interestFree: free });
  }
  return out;
}

/** Linha curta para cards: a maior parcela sem juros ou, sem ela, a maior com juros. */
export function installmentSummary(priceCents: number, c: StoreSettings["commerce"]) {
  const opts = installmentOptions(priceCents, c);
  if (!opts.length) return null;
  const free = opts.filter((o) => o.interestFree).at(-1);
  const best = free ?? opts.at(-1)!;
  return `ou ${best.count}x de ${formatBRL(best.perCents)}${best.interestFree ? " sem juros" : ""}`;
}

/** Valor digitado no painel → centavos. Aceita "1.234,56", "1234,56", "1234.56" e "6.799". Vazio → null. */
export function parseMoney(input: string): number | null {
  const t = input.trim().replace(/^R\$\s*/, "");
  if (!t) return null;
  let norm: string;
  if (t.includes(",")) norm = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) norm = t.replace(/\./g, ""); // ponto como milhar
  else norm = t;
  if (!/^\d+(\.\d{1,2})?$/.test(norm)) return null;
  return Math.round(Number(norm) * 100);
}
