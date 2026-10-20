import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifySignature } from "@/lib/mercadopago";

const secret = "test-secret";
const sign = (id: string, req: string, ts: number) =>
  createHmac("sha256", secret).update(`id:${id};request-id:${req};ts:${ts};`).digest("hex");

describe("assinatura do webhook Mercado Pago", () => {
  const now = 1_790_000_000_000;
  const ts = Math.floor(now / 1000);

  it("aceita assinatura válida", () => {
    const v1 = sign("123456", "req-1", ts);
    expect(verifySignature({ signature: `ts=${ts},v1=${v1}`, requestId: "req-1", dataId: "123456", secret, now })).toBe(true);
  });

  it("normaliza data.id alfanumérico para minúsculas", () => {
    const v1 = sign("abc123", "req-1", ts);
    expect(verifySignature({ signature: `ts=${ts},v1=${v1}`, requestId: "req-1", dataId: "ABC123", secret, now })).toBe(true);
  });

  it("rejeita assinatura adulterada, id trocado, ausência e replay", () => {
    const v1 = sign("123456", "req-1", ts);
    expect(verifySignature({ signature: `ts=${ts},v1=${"0".repeat(64)}`, requestId: "req-1", dataId: "123456", secret, now })).toBe(false);
    expect(verifySignature({ signature: `ts=${ts},v1=${v1}`, requestId: "req-1", dataId: "999", secret, now })).toBe(false);
    expect(verifySignature({ signature: null, requestId: "req-1", dataId: "123456", secret, now })).toBe(false);
    expect(verifySignature({ signature: `ts=${ts},v1=${v1}`, requestId: "req-1", dataId: "123456", secret, now: now + 3_600_000 })).toBe(false);
  });
});
