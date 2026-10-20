import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "inverse";

const tones: Record<Tone, string> = {
  neutral: "bg-bg-subtle text-fg ring-1 ring-border",
  accent: "bg-accent text-accent-fg",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  danger: "bg-danger/12 text-danger",
  inverse: "bg-fg text-bg",
};

export function Badge({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold tracking-[0.01em] ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
