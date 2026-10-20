"use client";

import { Cable, Headphones, Laptop, Tablet, Watch } from "lucide-react";
import { useId } from "react";
import type { Category } from "@/lib/catalog";
import { phoneSpec, type PhoneSpec } from "@/lib/phone-spec";

// Ilustração original (SVG) usada quando a loja ainda não enviou fotos.
// Não reproduz logotipos nem imagens de terceiros, e acompanha a cor da variante.

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (s: number) => Math.max(0, Math.min(255, ((n >> s) & 255) + amt));
  return `rgb(${c(16)} ${c(8)} ${c(0)})`;
}

// Aparelho em coordenadas locais 240×500, como na vitrine: traseira atrás, frente sobreposta.
const W = 240;
const H = 500;
const R = 42;

function Lens({ x, y, r, id, color }: { x: number; y: number; r: number; id: string; color: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r + 4} fill={shade(color, -55)} />
      <circle cx={x} cy={y} r={r} fill={`url(#lens-${id})`} />
      <circle cx={x - r * 0.3} cy={y - r * 0.35} r={r * 0.18} fill="#fff" opacity="0.4" />
    </g>
  );
}

function Back({ spec, color, id }: { spec: PhoneSpec; color: string; id: string }) {
  const bump = shade(color, 16);
  const flash = <circle r="6" fill="#f3ead2" opacity="0.85" />;
  const cams = {
    triple: (
      <>
        <rect x="18" y="18" width="112" height="112" rx="30" fill={bump} stroke="#fff" strokeOpacity="0.22" />
        <Lens x={48} y={48} r={17} id={id} color={color} />
        <Lens x={48} y={100} r={17} id={id} color={color} />
        <Lens x={100} y={74} r={17} id={id} color={color} />
        <g transform="translate(103 34)">{flash}</g>
        <circle cx="103" cy="114" r="6" fill={shade(color, -45)} />
      </>
    ),
    diagonal: (
      <>
        <rect x="18" y="18" width="96" height="96" rx="26" fill={bump} stroke="#fff" strokeOpacity="0.22" />
        <Lens x={44} y={44} r={15} id={id} color={color} />
        <Lens x={88} y={88} r={15} id={id} color={color} />
        <g transform="translate(90 42)">{flash}</g>
      </>
    ),
    vertical: (
      <>
        <rect x="20" y="18" width="52" height="108" rx="26" fill={bump} stroke="#fff" strokeOpacity="0.22" />
        <Lens x={46} y={45} r={15} id={id} color={color} />
        <Lens x={46} y={99} r={15} id={id} color={color} />
        <g transform="translate(90 34)">{flash}</g>
      </>
    ),
    single: (
      <>
        <Lens x={42} y={42} r={15} id={id} color={color} />
        <g transform="translate(76 34)">{flash}</g>
      </>
    ),
  }[spec.cameras];
  return (
    <g>
      <rect width={W} height={H} rx={R} fill={shade(color, -42)} />
      <rect x="3" y="3" width={W - 6} height={H - 6} rx={R - 3} fill={`url(#body-${id})`} />
      <rect x="3" y="3" width={W - 6} height={H - 6} rx={R - 3} fill={`url(#edge-${id})`} />
      <g transform="translate(6 6)">{cams}</g>
    </g>
  );
}

function Front({ spec, color, id }: { spec: PhoneSpec; color: string; id: string }) {
  const home = spec.front === "home";
  const screen = home ? { x: 14, y: 62, w: W - 28, h: H - 124, r: 4 } : { x: 9, y: 9, w: W - 18, h: H - 18, r: R - 9 };
  return (
    <g>
      <rect width={W} height={H} rx={R} fill={shade(color, -10)} />
      <rect x="3" y="3" width={W - 6} height={H - 6} rx={R - 3} fill={home ? shade(color, -40) : "#050506"} />
      <clipPath id={`scr-${id}`}>
        <rect x={screen.x} y={screen.y} width={screen.w} height={screen.h} rx={screen.r} />
      </clipPath>
      <g clipPath={`url(#scr-${id})`}>
        <rect width={W} height={H} fill={`url(#wall-${id})`} />
        <path d="M-20 330 C 60 250, 140 420, 260 250 L 260 520 L -20 520 Z" fill={shade(color, 70)} opacity="0.55" />
        <path d="M-20 400 C 80 330, 150 470, 260 360 L 260 520 L -20 520 Z" fill={shade(color, 110)} opacity="0.35" />
      </g>
      {spec.front === "island" && <rect x={W / 2 - 34} y="22" width="68" height="20" rx="10" fill="#000" />}
      {spec.front === "notch" && <path d={`M${W / 2 - 52} 9 h104 v8 a16 16 0 0 1 -16 16 h-72 a16 16 0 0 1 -16 -16 Z`} fill="#000" />}
      {home && <circle cx={W / 2} cy={H - 31} r="18" fill="none" stroke={shade(color, 10)} strokeWidth="3" />}
    </g>
  );
}

/** Ilustração do modelo (traseira + frente), com câmeras e tela de acordo com a geração. */
export function PhoneArt({ color = "#2b2b2e", name = "", className = "" }: { color?: string; name?: string; className?: string }) {
  // IDs únicos: gradientes repetidos dentro de um <dialog> oculto somem no Chrome.
  const id = useId().replace(/:/g, "");
  const spec = phoneSpec(name);
  const scale = spec.big ? 1 : 0.9;
  return (
    <svg viewBox="0 0 440 600" className={className} overflow="visible" role="img" aria-hidden>
      <defs>
        <linearGradient id={`body-${id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={shade(color, 28)} />
          <stop offset="0.55" stopColor={color} />
          <stop offset="1" stopColor={shade(color, -34)} />
        </linearGradient>
        <linearGradient id={`edge-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.06" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.94" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={`wall-${id}`} x1="0" x2="0.4" y1="0" y2="1">
          <stop offset="0" stopColor={shade(color, -70)} />
          <stop offset="1" stopColor={shade(color, 10)} />
        </linearGradient>
        <radialGradient id={`lens-${id}`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#4a5a78" />
          <stop offset="0.35" stopColor="#111522" />
          <stop offset="1" stopColor="#020205" />
        </radialGradient>
        <filter id={`soft-${id}`} x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodOpacity="0.25" />
        </filter>
      </defs>
      <g transform={`translate(220 300) scale(${scale}) translate(-220 -300)`} filter={`url(#soft-${id})`}>
        <g transform="translate(20 20)">
          <Back spec={spec} color={color} id={id} />
        </g>
        <g transform="translate(180 80)">
          <Front spec={spec} color={color} id={id} />
        </g>
      </g>
    </svg>
  );
}

const icons = { ipad: Tablet, mac: Laptop, watch: Watch, airpods: Headphones, acessorio: Cable } as const;

export function DeviceArt({ category, color, name, className = "" }: { category: Category; color?: string | null; name: string; className?: string }) {
  if (category === "iphone") {
    return <PhoneArt color={color ?? undefined} name={name} className={className} />;
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
