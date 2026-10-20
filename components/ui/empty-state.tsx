import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[24px] bg-bg-subtle px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-surface ring-1 ring-border">
        <Icon aria-hidden className="size-6 text-muted" />
      </span>
      <h2 className="text-headline">{title}</h2>
      {text && <p className="max-w-sm text-[15px] text-muted">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
