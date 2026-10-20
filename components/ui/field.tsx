import type { ComponentProps, ReactNode } from "react";

export const inputClass =
  "w-full rounded-[12px] bg-surface px-3.5 text-[16px] text-fg ring-1 ring-border transition-shadow duration-200 placeholder:text-muted/70 hover:ring-border-strong focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60 aria-invalid:ring-danger";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// font-size 16px evita o zoom automático do Safari no iPhone ao focar o campo.
export const Input = ({ className = "", ...p }: ComponentProps<"input">) => (
  <input className={`${inputClass} h-11 ${className}`} {...p} />
);

export const Textarea = ({ className = "", ...p }: ComponentProps<"textarea">) => (
  <textarea className={`${inputClass} min-h-24 py-2.5 ${className}`} {...p} />
);

export const Select = ({ className = "", ...p }: ComponentProps<"select">) => (
  <select className={`${inputClass} h-11 appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9 ${className}`}
    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
    {...p} />
);

export function Toggle({ label, description, ...p }: ComponentProps<"input"> & { label: string; description?: string }) {
  return (
    <label className="flex items-start justify-between gap-4 py-2">
      <span className="grid gap-0.5">
        <span className="text-[15px] font-medium">{label}</span>
        {description && <span className="text-[13px] text-muted">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" role="switch" className="peer sr-only" {...p} />
        <span className="h-7 w-12 rounded-full bg-border-strong transition-colors duration-200 peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg" />
        <span className="pointer-events-none absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform duration-200 ease-premium peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
