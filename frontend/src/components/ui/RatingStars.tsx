import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: 'xs' | 'sm' | 'md';
  showValue?: boolean;
  className?: string;
}

const starSize = { xs: 'h-3 w-3', sm: 'h-3.5 w-3.5', md: 'h-4 w-4' };

export const RatingStars = ({ rating, count, size = 'sm', showValue = true, className }: RatingStarsProps) => {
  const safeRating = Math.max(0, Math.min(5, rating || 0));

  return (
    <div className={cn('flex items-center gap-2', className)} aria-label={`${safeRating.toFixed(1)} out of 5 stars`}>
      <div className="relative inline-flex shrink-0">
        <div className="flex gap-[2px] text-white/15" aria-hidden>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className={cn(starSize[size], 'fill-current stroke-none')} />
          ))}
        </div>
        <div
          className="absolute inset-y-0 left-0 flex gap-[2px] overflow-hidden text-accent"
          style={{ width: `${(safeRating / 5) * 100}%` }}
          aria-hidden
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className={cn(starSize[size], 'shrink-0 fill-current stroke-none')} />
          ))}
        </div>
      </div>
      {showValue && (
        <span className="text-[11px] tabular-nums text-white/45">
          {safeRating > 0 ? safeRating.toFixed(1) : 'New'}
          {typeof count === 'number' && count > 0 ? ` (${count})` : ''}
        </span>
      )}
    </div>
  );
};
