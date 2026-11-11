import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

export const Logo = ({ compact = false, className }: { compact?: boolean; className?: string }) => (
  <Link
    to="/"
    aria-label="AURELIS home"
    className={cn('group inline-flex items-center gap-2.5 text-pearl', className)}
  >
    <span className="relative flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/10 bg-gradient-to-br from-white/[0.12] to-white/[0.02] shadow-inner-line">
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
        <defs>
          <linearGradient id="aurelis-mark" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F5F0E8" />
            <stop offset="0.55" stopColor="#C7A17A" />
            <stop offset="1" stopColor="#8E6A45" />
          </linearGradient>
        </defs>
        <path d="M12 3.2 20 20.8h-4.3l-1.5-3.6H9.8l-1.5 3.6H4L12 3.2Zm0 6.5-1.7 4.4h3.4L12 9.7Z" fill="url(#aurelis-mark)" />
      </svg>
    </span>
    {!compact && (
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-[0.34em] text-pearl transition-colors group-hover:text-white">
          AURELIS
        </span>
        <span className="mt-1 text-[8px] uppercase tracking-[0.3em] text-white/35">Technology, refined</span>
      </span>
    )}
  </Link>
);
