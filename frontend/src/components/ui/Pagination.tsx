import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

const pageNumbers = (current: number, total: number) => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total] as const;
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total] as const;
  return [1, '…', current - 1, current, current + 1, '…', total] as const;
};

export const Pagination = ({
  page,
  pages,
  onChange,
  className,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  className?: string;
}) => {
  if (pages <= 1) return null;

  return (
    <nav className={cn('flex items-center justify-center gap-1.5', className)} aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/55 transition hover:border-white/20 hover:text-white disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pageNumbers(page, pages).map((entry, index) =>
        entry === '…' ? (
          <span key={`gap-${index}`} className="px-2 text-white/25">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onChange(entry)}
            aria-current={entry === page ? 'page' : undefined}
            className={cn(
              'h-10 min-w-10 rounded-full px-3 text-[12px] tabular-nums transition',
              entry === page
                ? 'bg-pearl font-semibold text-ink'
                : 'border border-white/10 text-white/55 hover:border-white/20 hover:text-white'
            )}
          >
            {entry}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        aria-label="Next page"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/55 transition hover:border-white/20 hover:text-white disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
};
