import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-[28px] border border-white/[0.07] bg-white/[0.02] px-6 py-16 text-center',
      className
    )}
  >
    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/50">
      <Icon className="h-6 w-6" strokeWidth={1.5} />
    </div>
    <h3 className="text-[18px] font-medium text-pearl">{title}</h3>
    <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-white/40">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);
