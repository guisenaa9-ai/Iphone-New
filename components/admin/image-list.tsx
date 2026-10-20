"use client";

import { ImagePlus, Loader2, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { browserClient } from "@/lib/supabase/browser";

const MAX_MB = 5;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml", "image/x-icon"];

/** Envia para o Supabase Storage (bucket store-assets) e devolve a URL pública. */
export async function uploadImage(file: File, folder: string) {
  if (!TYPES.includes(file.type)) throw new Error("Formato não aceito. Use JPG, PNG, WebP ou AVIF.");
  if (file.size > MAX_MB * 1024 * 1024) throw new Error(`Imagem acima de ${MAX_MB} MB.`);
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const storage = browserClient().storage.from("store-assets");
  const { error } = await storage.upload(path, file, { cacheControl: "31536000", contentType: file.type });
  if (error) throw new Error(`Falha no envio: ${error.message}`);
  return storage.getPublicUrl(path).data.publicUrl;
}

export function ImageList({ value, onChange, folder, max = 10, label }: { value: string[]; onChange: (v: string[]) => void; folder: string; max?: number; label: string }) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const move = (i: number, d: number) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium">{label}</p>
      <ul className="flex flex-wrap gap-3">
        {value.map((src, i) => (
          <li key={src + i} className="group relative size-24 overflow-hidden rounded-[14px] bg-bg-subtle ring-1 ring-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Imagem ${i + 1}`} className="size-full object-contain" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-surface/90 p-1">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="grid size-7 place-items-center rounded-full disabled:opacity-30" aria-label="Mover para a esquerda"><ArrowLeft className="size-3.5" /></button>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="grid size-7 place-items-center rounded-full text-danger" aria-label="Remover imagem"><Trash2 className="size-3.5" /></button>
              <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="grid size-7 place-items-center rounded-full disabled:opacity-30" aria-label="Mover para a direita"><ArrowRight className="size-3.5" /></button>
            </div>
          </li>
        ))}
        {value.length < max && (
          <li>
            <button type="button" disabled={busy} onClick={() => file.current?.click()} className="grid size-24 place-items-center rounded-[14px] border border-dashed border-border-strong text-muted hover:text-fg">
              {busy ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <ImagePlus aria-hidden className="size-5" />}
              <span className="sr-only">Enviar imagem</span>
            </button>
          </li>
        )}
      </ul>
      <input
        ref={file}
        type="file"
        accept={TYPES.join(",")}
        multiple
        hidden
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])].slice(0, max - value.length);
          e.target.value = "";
          if (!files.length) return;
          setBusy(true);
          try {
            const urls: string[] = [];
            for (const f of files) urls.push(await uploadImage(f, folder));
            onChange([...value, ...urls]);
          } catch (err) {
            toast((err as Error).message, "error");
          } finally {
            setBusy(false);
          }
        }}
      />
      {value.length < max && (
        <div className="flex gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="ou cole a URL de uma imagem (https://…)" className="h-10 flex-1 rounded-[10px] bg-surface px-3 text-[14px] ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-accent" aria-label={`${label}: URL`} />
          <button
            type="button"
            onClick={() => {
              try {
                const u = new URL(url);
                if (u.protocol !== "https:") throw new Error();
                onChange([...value, u.toString()]);
                setUrl("");
              } catch {
                toast("Informe uma URL https válida.", "error");
              }
            }}
            className="h-10 rounded-full px-4 text-[14px] ring-1 ring-border"
          >
            Adicionar
          </button>
        </div>
      )}
    </div>
  );
}
