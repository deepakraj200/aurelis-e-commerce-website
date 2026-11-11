import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { miscService } from '@/services/miscService';
import { getErrorMessage } from '@/services/api';
import { cn } from '@/utils/cn';
import { useUiStore } from '@/store/uiStore';

export const Newsletter = ({ compact = false, className }: { compact?: boolean; className?: string }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const pushActivity = useUiStore((state) => state.pushActivity);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const message = await miscService.subscribe(email.trim());
      setDone(true);
      setEmail('');
      toast.success(message);
      pushActivity({ title: 'Welcome to the inner circle', message: 'Private releases and studio stories, occasionally.' });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(className)}>
      {!compact && (
        <>
          <p className="eyebrow mb-4">The AURELIS Review</p>
          <h3 className="max-w-[440px] text-[28px] leading-[1.12] text-pearl sm:text-[34px]">
            Private releases, quietly delivered.
          </h3>
          <p className="mt-3 max-w-[380px] text-[13px] leading-relaxed text-white/40">
            Join the inner circle for early access, studio notes and considered editions. No noise.
          </p>
        </>
      )}

      <form onSubmit={submit} className="relative mt-6 flex max-w-md items-center">
        <div className="pointer-events-none absolute left-4 text-white/30">
          <Mail className="h-4 w-4" />
        </div>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Your email address"
          aria-label="Email address for newsletter"
          disabled={done}
          className="h-12 w-full rounded-full border border-white/[0.09] bg-white/[0.035] pl-11 pr-[132px] text-[12px] text-pearl placeholder:text-white/30 transition focus:border-accent/35 focus:bg-white/[0.06] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || done}
          className="absolute right-1.5 flex h-9 items-center gap-2 rounded-full bg-pearl px-4 text-[11px] font-semibold text-ink transition hover:bg-white disabled:opacity-80"
        >
          <AnimatePresence mode="wait" initial={false}>
            {done ? (
              <motion.span
                key="done"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" /> Joined
              </motion.span>
            ) : (
              <motion.span
                key="join"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                {loading ? 'Joining…' : 'Subscribe'}
                {!loading && <ArrowRight className="h-3.5 w-3.5" />}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </form>
      <p className="mt-3 text-[10px] text-white/25">By subscribing you agree to our considered, infrequent correspondence.</p>
    </div>
  );
};
