import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'dark';

const tones: Record<Tone, string> = {
  neutral: 'bg-white/[0.07] text-white/75 border-white/10',
  accent: 'bg-accent/12 text-accent-light border-accent/25',
  success: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
  warning: 'bg-amber-400/10 text-amber-200 border-amber-400/20',
  danger: 'bg-red-400/10 text-red-300 border-red-400/20',
  info: 'bg-sky-400/10 text-sky-200 border-sky-400/20',
  dark: 'bg-ink/80 text-white/80 border-white/10',
};

export const Badge = ({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] backdrop-blur-md',
      tones[tone],
      className
    )}
  >
    {children}
  </span>
);
