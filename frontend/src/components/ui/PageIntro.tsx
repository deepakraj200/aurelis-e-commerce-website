import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export const PageIntro = ({
  eyebrow,
  title,
  description,
  actions,
  className,
  centered,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  centered?: boolean;
}) => (
  <div
    className={cn(
      'flex flex-col gap-6 border-b border-white/[0.06] pb-10 sm:flex-row sm:items-end sm:justify-between sm:pb-12',
      centered && 'sm:flex-col sm:items-center sm:text-center',
      className
    )}
  >
    <div className={cn('max-w-2xl', centered && 'mx-auto')}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="text-[36px] leading-[1.02] tracking-[-0.045em] text-pearl sm:text-[52px]">{title}</h1>
      {description && <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-white/40 sm:text-[14px]">{description}</p>}
    </div>
    {actions && <div className="shrink-0">{actions}</div>}
  </div>
);
