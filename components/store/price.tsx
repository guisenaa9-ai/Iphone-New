import { formatBRL, installmentSummary } from "@/lib/money";
import type { StoreSettings } from "@/lib/settings";

export function Price({
  cents,
  compareAt,
  commerce,
  from = false,
  size = "md",
}: {
  cents: number;
  compareAt?: number | null;
  commerce: StoreSettings["commerce"];
  from?: boolean;
  size?: "md" | "lg";
}) {
  const inst = installmentSummary(cents, commerce);
  return (
    <div className="grid gap-0.5">
      <div className="flex flex-wrap items-baseline gap-x-2">
        {from && <span className="text-[13px] text-muted">a partir de</span>}
        <span className={size === "lg" ? "text-[28px] font-semibold tracking-[-0.02em]" : "text-[17px] font-semibold tracking-[-0.01em]"}>
          {formatBRL(cents)}
        </span>
        {compareAt ? (
          <s className="text-[14px] text-muted" aria-label={`Preço anterior ${formatBRL(compareAt)}`}>
            {formatBRL(compareAt)}
          </s>
        ) : null}
      </div>
      {inst && <span className="text-[13px] text-muted">{inst}</span>}
    </div>
  );
}
