import { cn } from '@/utils/cn';
import { discountPercent, formatMoney } from '@/utils/format';

export const Price = ({
  price,
  originalPrice,
  size = 'md',
  showDiscount = true,
  className,
}: {
  price: number;
  originalPrice?: number | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDiscount?: boolean;
  className?: string;
}) => {
  const discount = discountPercent(price, originalPrice);
  const textSize = {
    sm: 'text-[13px]',
    md: 'text-[15px]',
    lg: 'text-[22px]',
    xl: 'text-[34px] sm:text-[40px]',
  }[size];

  return (
    <div className={cn('flex flex-wrap items-baseline gap-2.5', className)}>
      <span className={cn('font-medium tracking-[-0.03em] text-pearl', textSize)}>
        {formatMoney(price, 'USD', price % 1 !== 0)}
      </span>
      {discount > 0 && (
        <>
          <span className="text-[12px] text-white/30 line-through">{formatMoney(originalPrice || 0, 'USD', false)}</span>
          {showDiscount && (
            <span className="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-accent-light">
              Save {discount}%
            </span>
          )}
        </>
      )}
    </div>
  );
};
