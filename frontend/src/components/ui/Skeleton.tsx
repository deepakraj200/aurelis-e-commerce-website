import { cn } from '@/utils/cn';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('skeleton', className)} aria-hidden />
);

export const ProductCardSkeleton = () => (
  <div className="rounded-[26px] border border-white/[0.06] bg-white/[0.02] p-3">
    <Skeleton className="aspect-[4/5] w-full rounded-[20px]" />
    <div className="px-2 pb-2 pt-5">
      <Skeleton className="h-3 w-1/3 rounded-full" />
      <Skeleton className="mt-3 h-4 w-3/4 rounded-full" />
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({ length: count }).map((_, index) => (
      <ProductCardSkeleton key={index} />
    ))}
  </div>
);

export const PageLoader = () => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
    <div className="relative h-9 w-9">
      <div className="absolute inset-0 rounded-full border border-white/10" />
      <div className="absolute inset-0 animate-spin rounded-full border-t border-accent" />
    </div>
    <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">Loading</p>
  </div>
);
