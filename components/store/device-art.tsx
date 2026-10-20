"use client";

import { Cable, Headphones, Laptop, Tablet, Watch } from "lucide-react";
import { useId } from "react";
import type { Category } from "@/lib/catalog";

// Ilustração original (SVG) usada quando a loja ainda não enviou fotos.
// Não reproduz logotipos nem imagens de terceiros, e acompanha a cor da variante.

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (s: number) => Math.max(0, Math.min(255, ((n >> s) & 255) + amt));
  return `rgb(${c(16)} ${c(8)} ${c(0)})`;
}

export function PhoneArt({ color = "#2b2b2e", lenses = 2, className = "" }: { color?: string; lenses?: 2 | 3; className?: string }) {
  // IDs únicos: gradientes repetidos dentro de um <dialog> oculto somem no Chrome.
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 300 600" className={className} overflow="visible" role="img" aria-hidden>
      <defs>
        <linearGradient id={`body-${id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={shade(color, 28)} />
          <stop offset="0.55" stopColor={color} />
          <stop offset="1" stopColor={shade(color, -34)} />
        </linearGradient>
        <linearGradient id={`edge-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.08" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.92" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id={`lens-${id}`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#4a5a78" />
          <stop offset="0.35" stopColor="#111522" />
          <stop offset="1" stopColor="#020205" />
        </radialGradient>
        <filter id={`soft-${id}`} x="-40%" y="-20%" width="180%" height="150%">
          <feDropShadow dx="0" dy="24" stdDeviation="22" floodOpacity="0.28" />
        </filter>
      </defs>
      <g filter={`url(#soft-${id})`}>
        <rect x="18" y="12" width="264" height="568" rx="54" fill={shade(color, -50)} />
        <rect x="22" y="16" width="256" height="560" rx="50" fill={`url(#body-${id})`} />
        <rect x="22" y="16" width="256" height="560" rx="50" fill={`url(#edge-${id})`} />
      </g>
      <rect x="40" y="36" width={lenses === 3 ? 124 : 104} height={lenses === 3 ? 124 : 112} rx="32" fill={shade(color, 14)} opacity="0.9" />
      <rect x="40" y="36" width={lenses === 3 ? 124 : 104} height={lenses === 3 ? 124 : 112} rx="32" fill="none" stroke="#fff" strokeOpacity="0.25" />
      {(lenses === 3
        ? [
            [74, 70],
            [74, 128],
            [130, 99],
          ]
        : [
            [74, 66],
            [74, 118],
          ]
      ).map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="23" fill={shade(color, -60)} />
          <circle cx={cx} cy={cy} r="18" fill={`url(#lens-${id})`} />
          <circle cx={cx - 5} cy={cy - 6} r="3.5" fill="#fff" opacity="0.35" />
        </g>
      ))}
      <circle cx={lenses === 3 ? 130 : 124} cy={lenses === 3 ? 56 : 60} r="7" fill={shade(color, -40)} />
    </svg>
  );
}

const icons = { ipad: Tablet, mac: Laptop, watch: Watch, airpods: Headphones, acessorio: Cable } as const;

export function DeviceArt({ category, color, name, className = "" }: { category: Category; color?: string | null; name: string; className?: string }) {
  if (category === "iphone") {
    return <PhoneArt color={color ?? undefined} lenses={/pro/i.test(name) ? 3 : 2} className={className} />;
  }
  const Icon = icons[category];
  return (
    <div className={`grid place-items-center ${className}`} aria-hidden>
      <span
        className="grid aspect-square w-3/5 place-items-center rounded-[32%] shadow-card ring-1 ring-border"
        style={{ background: color ? `linear-gradient(145deg, ${shade(color, 30)}, ${color})` : "var(--surface)" }}
      >
        <Icon className="size-2/5" strokeWidth={1.25} color={color ? "#fff" : "currentColor"} />
      </span>
    </div>
  );
}
