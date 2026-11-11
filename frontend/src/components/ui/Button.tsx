import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'glass' | 'accent' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  primary:
    'bg-pearl text-ink hover:bg-white shadow-[0_10px_40px_-16px_rgba(255,255,255,0.5)] disabled:hover:bg-pearl',
  secondary: 'bg-white/[0.07] text-pearl border border-white/10 hover:bg-white/[0.12]',
  glass: 'glass text-pearl hover:bg-white/[0.09]',
  accent:
    'bg-accent-sheen text-[#1A140E] font-semibold hover:brightness-105 shadow-[0_18px_50px_-24px_rgba(199,161,122,0.9)]',
  ghost: 'text-white/65 hover:text-white hover:bg-white/[0.06]',
  danger: 'bg-red-500/12 text-red-200 border border-red-400/20 hover:bg-red-500/20',
  outline: 'border border-white/15 text-pearl hover:border-white/30 hover:bg-white/[0.04]',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[12px] gap-1.5',
  md: 'h-11 px-6 text-[13px] gap-2',
  lg: 'h-[52px] px-8 text-[14px] gap-2.5',
  icon: 'h-10 w-10',
};

export const buttonStyles = (variant: Variant = 'primary', size: Size = 'md', className?: string) =>
  cn(
    'group/btn relative inline-flex select-none items-center justify-center rounded-full font-medium tracking-[-0.01em] transition-all duration-300 ease-premium disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.985]',
    variants[variant],
    sizes[size],
    className
  );

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={buttonStyles(variant, size, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  )
);

Button.displayName = 'Button';
