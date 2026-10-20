export const Skeleton = ({ className = "" }: { className?: string }) => <div aria-hidden className={`skeleton ${className}`} />;

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-label="Carregando produtos" className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="grid gap-3">
          <Skeleton className="aspect-[4/5] w-full rounded-[20px]" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
