"use client";

import { ZoomIn } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import type { Category } from "@/lib/catalog";
import { ProductMedia } from "./product-media";

/** Galeria com miniaturas, lupa no desktop e ampliação em tela cheia (com pinça no celular). */
export function Gallery({ images, name, category, color }: { images: string[]; name: string; category: Category; color: string | null }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState<string | null>(null);
  useEffect(() => setIndex(0), [images]);

  const slides = images.length ? images : [null];
  const current = slides[Math.min(index, slides.length - 1)];
  const onMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (!current || window.matchMedia("(hover: none)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div className="grid gap-3">
      <div className="relative overflow-hidden rounded-[28px] bg-bg-subtle">
        <button
          type="button"
          onClick={() => setZoom(true)}
          onMouseMove={onMove}
          onMouseLeave={() => setOrigin(null)}
          className="relative block aspect-square w-full cursor-zoom-in"
          aria-label={`Ampliar imagem de ${name}`}
        >
          <div
            key={current ?? color ?? "art"}
            className="absolute inset-[8%] transition-transform duration-300 ease-premium [animation:fade-in_.4s_var(--ease)]"
            style={origin ? { transform: "scale(1.8)", transformOrigin: origin } : undefined}
          >
            <ProductMedia src={current} alt={`${name}${slides.length > 1 ? `, imagem ${index + 1} de ${slides.length}` : ""}`} category={category} color={color} name={name} sizes="(min-width: 1024px) 50vw, 100vw" priority />
          </div>
          <span className="glass absolute bottom-4 right-4 grid size-10 place-items-center rounded-full ring-1 ring-border" aria-hidden>
            <ZoomIn className="size-[18px]" />
          </span>
        </button>
      </div>
      {slides.length > 1 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto" role="group" aria-label="Imagens do produto">
          {slides.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver imagem ${i + 1}`}
              aria-pressed={i === index}
              className={`relative size-18 shrink-0 overflow-hidden rounded-[16px] bg-bg-subtle ring-2 transition-[box-shadow] ${i === index ? "ring-fg" : "ring-transparent hover:ring-border-strong"}`}
            >
              <span className="absolute inset-1.5">
                <ProductMedia src={src} alt="" category={category} color={color} name={name} sizes="72px" />
              </span>
            </button>
          ))}
        </div>
      )}
      <Dialog open={zoom} onClose={() => setZoom(false)} title={name} wide>
        <div className="relative aspect-square w-full overflow-auto rounded-[20px] bg-bg-subtle [touch-action:pinch-zoom]">
          <div className="absolute inset-[4%]">
            <ProductMedia src={current} alt={name} category={category} color={color} name={name} sizes="100vw" />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
