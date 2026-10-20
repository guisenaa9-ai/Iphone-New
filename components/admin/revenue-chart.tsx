"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/money";

type Point = { day: string; cents: number };

const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

/** Receita paga por dia: uma série, barras finas na cor do texto, tooltip e tabela equivalente. */
export function RevenueChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = 200;
  const pad = { top: 12, bottom: 24, left: 0, right: 0 };
  const max = Math.max(...data.map((d) => d.cents), 1);
  const step = (W - pad.left - pad.right) / Math.max(data.length, 1);
  const barW = Math.max(step - 2, 2); // 2px de respiro entre barras
  const y = (c: number) => pad.top + (H - pad.top - pad.bottom) * (1 - c / max);
  const h = hover != null ? data[hover] : null;

  return (
    <figure className="grid gap-3">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-52 w-full" preserveAspectRatio="none" role="img" aria-label="Receita paga por dia">
          <line x1="0" x2={W} y1={H - pad.bottom} y2={H - pad.bottom} stroke="var(--border-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line x1="0" x2={W} y1={pad.top} y2={pad.top} stroke="var(--border)" strokeDasharray="3 4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {data.map((d, i) => {
            const top = y(d.cents);
            const bh = Math.max(H - pad.bottom - top, d.cents ? 2 : 0);
            const x = pad.left + i * step + 1;
            return (
              <g key={d.day} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                {/* área de toque maior que a barra */}
                <rect x={pad.left + i * step} y={0} width={step} height={H} fill="transparent" />
                <path
                  d={bh ? `M${x},${H - pad.bottom} v${-(bh - Math.min(4, bh))} q0,-${Math.min(4, bh)} ${Math.min(4, barW / 2)},-${Math.min(4, bh)} h${barW - 2 * Math.min(4, barW / 2)} q${Math.min(4, barW / 2)},0 ${Math.min(4, barW / 2)},${Math.min(4, bh)} v${bh - Math.min(4, bh)} z` : ""}
                  fill="var(--fg)"
                  opacity={hover == null || hover === i ? 0.9 : 0.35}
                />
              </g>
            );
          })}
        </svg>
        <div className="mt-1 flex justify-between text-[12px] text-muted" aria-hidden>
          <span>{data[0] && fmtDay(data[0].day)}</span>
          <span>{data.at(-1) && fmtDay(data.at(-1)!.day)}</span>
        </div>
        <p className="pointer-events-none absolute right-0 top-0 text-[12px] text-muted" aria-hidden>
          máx. {formatBRL(max)}
        </p>
        {h && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-[10px] bg-surface-raised px-3 py-2 text-[13px] shadow-pop ring-1 ring-border"
            style={{ left: `${((hover! + 0.5) / data.length) * 100}%` }}
          >
            <p className="text-muted">{fmtDay(h.day)}</p>
            <p className="font-semibold text-fg">{formatBRL(h.cents)}</p>
          </div>
        )}
      </div>
      <details className="text-[13px]">
        <summary className="text-muted hover:text-fg">Ver dados em tabela</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-muted"><tr><th className="py-1 font-medium">Dia</th><th className="py-1 text-right font-medium">Receita paga</th></tr></thead>
          <tbody>
            {data.filter((d) => d.cents > 0).map((d) => (
              <tr key={d.day} className="border-t border-border"><td className="py-1">{fmtDay(d.day)}</td><td className="py-1 text-right tabular-nums">{formatBRL(d.cents)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
