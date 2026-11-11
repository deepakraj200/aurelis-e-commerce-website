import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export const SectionHeading = ({
  eyebrow,
  title,
  description,
  link,
  linkLabel,
  className,
  align = 'left',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  link?: string;
  linkLabel?: string;
  className?: string;
  align?: 'left' | 'center';
  children?: ReactNode;
}) => (
  <div
    className={cn(
      'flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
      align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
      className
    )}
  >
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="text-[30px] leading-[1.08] text-pearl sm:text-[42px]">{title}</h2>
      {description && <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-white/40">{description}</p>}
    </div>
    {link && linkLabel && (
      <Link
        to={link}
        className="group inline-flex shrink-0 items-center gap-2 text-[12px] font-medium text-white/55 transition hover:text-pearl"
      >
        {linkLabel}
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 transition group-hover:border-accent/40 group-hover:bg-accent/10">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    )}
  </div>
);
