import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Você está em" className="text-[13px] text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight aria-hidden className="size-3.5 opacity-60" />}
            {it.href ? (
              <Link href={it.href} className="rounded transition-colors hover:text-fg">
                {it.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-fg">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
