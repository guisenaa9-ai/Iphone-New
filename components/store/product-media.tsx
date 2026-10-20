import Image from "next/image";
import type { Category } from "@/lib/catalog";
import { DeviceArt } from "./device-art";

const optimizable = (src: string) => {
  try {
    const u = new URL(src);
    return u.pathname.startsWith("/storage/v1/object/public/") && u.protocol === "https:";
  } catch {
    return false;
  }
};

/** Foto do produto ou, sem foto, a ilustração na cor da variante. */
export function ProductMedia({
  src,
  alt,
  category,
  color,
  name,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority = false,
  className = "",
}: {
  src?: string | null;
  alt: string;
  category: Category;
  color?: string | null;
  name: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (!src) return <DeviceArt category={category} color={color} name={name} className={`h-full w-full ${className}`} />;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!optimizable(src)}
      className={`object-contain ${className}`}
    />
  );
}
