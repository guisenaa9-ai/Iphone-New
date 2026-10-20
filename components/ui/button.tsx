import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "inverse" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,color,box-shadow,transform,opacity] duration-200 ease-premium active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:brightness-[1.08] shadow-[0_1px_0_rgb(255_255_255/0.15)_inset]",
  secondary: "bg-bg-subtle text-fg ring-1 ring-border hover:ring-border-strong hover:bg-surface",
  ghost: "text-fg hover:bg-bg-subtle",
  inverse: "bg-fg text-bg hover:opacity-90",
  danger: "bg-danger text-white hover:brightness-110",
};

// Alturas ≥ 44px nos tamanhos md/lg (alvo de toque recomendado).
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-13 px-7 text-base",
};

export const buttonClass = (variant: Variant = "primary", size: Size = "md", extra = "") =>
  `${base} ${variants[variant]} ${sizes[size]} ${extra}`;

type Common = { variant?: Variant; size?: Size };

export function Button({ variant, size, className = "", ...props }: ComponentProps<"button"> & Common) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({ variant, size, className = "", ...props }: ComponentProps<typeof Link> & Common) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
