import { describe, expect, it } from "vitest";
import { formatBRL, installmentOptions, installmentSummary, parseMoney } from "@/lib/money";
import { DEFAULT_SETTINGS } from "@/lib/settings";

const commerce = { ...DEFAULT_SETTINGS.commerce, installmentsMax: 12, installmentsInterestFree: 10, installmentsMonthlyRate: 2 };

describe("money", () => {
  it("formata em reais", () => {
    expect(formatBRL(679900).replace(/\s/g, " ")).toBe("R$ 6.799,00");
  });

  it("interpreta valores digitados no padrão brasileiro", () => {
    expect(parseMoney("6.799,00")).toBe(679900);
    expect(parseMoney("6.799")).toBe(679900);
    expect(parseMoney("6799")).toBe(679900);
    expect(parseMoney("1234.5")).toBe(123450);
    expect(parseMoney("R$ 19,90")).toBe(1990);
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("abc")).toBeNull();
    expect(parseMoney("1,2,3")).toBeNull();
  });

  it("parcela sem juros até o limite e com juros (Price) acima", () => {
    const opts = installmentOptions(100000, commerce);
    expect(opts).toHaveLength(11); // 2x..12x
    const ten = opts.find((o) => o.count === 10)!;
    expect(ten).toMatchObject({ perCents: 10000, totalCents: 100000, interestFree: true });
    const twelve = opts.find((o) => o.count === 12)!;
    expect(twelve.interestFree).toBe(false);
    expect(twelve.perCents).toBe(9456); // 1000 * 0.02 / (1 - 1.02^-12) = 94.56
    expect(twelve.totalCents).toBe(9456 * 12);
  });

  it("não exibe parcelamento quando a loja não configurou", () => {
    expect(installmentOptions(100000, DEFAULT_SETTINGS.commerce)).toEqual([]);
    expect(installmentSummary(100000, DEFAULT_SETTINGS.commerce)).toBeNull();
  });

  it("resume com a maior parcela sem juros", () => {
    expect(installmentSummary(100000, commerce)?.replace(/\s/g, " ")).toBe("ou 10x de R$ 100,00 sem juros");
  });
});
