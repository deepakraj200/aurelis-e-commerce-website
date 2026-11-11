import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Check, X } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

export const ActivityIsland = () => {
  const activity = useUiStore((state) => state.activity);
  const dismiss = useUiStore((state) => state.dismissActivity);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[82px] z-[60] flex justify-center px-4 sm:top-[94px]">
      <AnimatePresence mode="wait">
        {activity && (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: -14, scale: 0.9, width: 210 }}
            animate={{ opacity: 1, y: 0, scale: 1, width: 'auto' }}
            exit={{ opacity: 0, y: -10, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.7 }}
            className={cn(
              'pointer-events-auto relative flex max-w-[calc(100vw-2rem)] items-center gap-3 overflow-hidden rounded-full border px-2.5 py-2 backdrop-blur-2xl',
              activity.tone === 'accent'
                ? 'border-accent/25 bg-[#141210]/90 shadow-[0_20px_60px_-24px_rgba(199,161,122,0.5)]'
                : 'border-white/12 bg-[#0c0c0e]/92 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.9)]'
            )}
            role="status"
            aria-live="polite"
          >
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                activity.tone === 'accent'
                  ? 'border-accent/30 bg-accent/15 text-accent-light'
                  : 'border-white/10 bg-white/[0.05] text-white/70'
              )}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 pr-1">
              <p className="truncate text-[11px] font-medium leading-tight text-white/85">{activity.title}</p>
              <p className="mt-0.5 max-w-[230px] truncate text-[10px] leading-tight text-white/35 sm:max-w-[320px]">
                {activity.message}
              </p>
            </div>
            {activity.href && (
              <Link
                to={activity.href}
                onClick={dismiss}
                className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                {activity.actionLabel || 'View'}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss notification"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/25 transition hover:bg-white/[0.08] hover:text-white/70"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
