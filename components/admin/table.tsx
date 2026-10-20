import type { ReactNode } from "react";

/** Tabela administrativa: rola na horizontal no celular, cabeçalho discreto. */
export function Table({ head, children, caption }: { head: ReactNode[]; children: ReactNode; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-[20px] bg-surface ring-1 ring-border">
      <table className="w-full min-w-[640px] text-left text-[14px]">
        <caption className="sr-only">{caption}</caption>
        <thead className="text-[12px] uppercase tracking-[0.04em] text-muted">
          <tr>{head.map((h, i) => <th key={i} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="[&_td]:border-t [&_td]:border-border [&_td]:px-4 [&_td]:py-3">{children}</tbody>
      </table>
    </div>
  );
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-title">{title}</h1>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
