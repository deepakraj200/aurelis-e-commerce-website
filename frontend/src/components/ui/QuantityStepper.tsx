import { Minus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export const QuantityStepper = ({
  value,
  onChange,
  min = 1,
  max = 20,
  disabled,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}) => (
  <div
    className={cn(
      'inline-flex h-11 items-center rounded-full border border-white/10 bg-white/[0.03] px-1',
      className
    )}
  >
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={disabled || value <= min}
      aria-label="Decrease quantity"
      className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-25"
    >
      <Minus className="h-3.5 w-3.5" />
    </motion.button>
    <span className="w-8 text-center text-[13px] font-medium tabular-nums text-pearl">{value}</span>
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={disabled || value >= max}
      aria-label="Increase quantity"
      className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-25"
    >
      <Plus className="h-3.5 w-3.5" />
    </motion.button>
  </div>
);
