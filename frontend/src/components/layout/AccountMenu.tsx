import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, LogOut, Package, User as UserIcon, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';
import { initials } from '@/utils/format';

export const AccountMenu = ({ compact = false }: { compact?: boolean }) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const pushActivity = useUiStore((state) => state.pushActivity);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleLogout = async () => {
    try {
      await logout();
      setOpen(false);
      pushActivity({ title: 'Signed out', message: 'Your bag has been cleared from this device.' });
      navigate('/');
    } catch {
      toast.error('We could not sign you out. Please try again.');
    }
  };

  if (!user) {
    return (
      <Link
        to="/login"
        aria-label="Sign in"
        className="flex h-10 w-10 items-center justify-center rounded-full text-white/65 transition hover:bg-white/[0.06] hover:text-white"
      >
        <UserRound className="h-[18px] w-[18px]" strokeWidth={1.7} />
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={cn(
          'flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] transition hover:border-white/20 hover:bg-white/[0.08]',
          compact ? 'h-9 w-9 justify-center' : 'h-10 pl-1.5 pr-3'
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent-light to-accent-deep text-[10px] font-semibold text-[#1b140d]">
          {initials(user.name)}
        </span>
        {!compact && <span className="max-w-[80px] truncate text-[11px] text-white/65">{user.name.split(' ')[0]}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong absolute right-0 top-12 w-[248px] overflow-hidden rounded-2xl p-2"
          >
            <div className="border-b border-white/[0.07] px-3 pb-3 pt-2">
              <p className="truncate text-[13px] font-medium text-pearl">{user.name}</p>
              <p className="mt-0.5 truncate text-[11px] text-white/35">{user.email}</p>
            </div>
            <div className="py-1.5">
              <Link
                to="/profile"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] text-white/65 transition hover:bg-white/[0.06] hover:text-white"
              >
                <UserIcon className="h-4 w-4" strokeWidth={1.6} /> Profile
              </Link>
              <Link
                to="/orders"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] text-white/65 transition hover:bg-white/[0.06] hover:text-white"
              >
                <Package className="h-4 w-4" strokeWidth={1.6} /> My orders
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] text-accent-light transition hover:bg-accent/10"
                >
                  <LayoutDashboard className="h-4 w-4" strokeWidth={1.6} /> Admin studio
                </Link>
              )}
            </div>
            <div className="border-t border-white/[0.07] pt-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] text-white/50 transition hover:bg-red-500/10 hover:text-red-200"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.6} /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
