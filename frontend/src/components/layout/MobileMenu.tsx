import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Heart, Package, UserRound, X } from 'lucide-react';
import type { Category } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { Logo } from '@/components/ui/Logo';
import { SearchBar } from './SearchBar';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}

export const MobileMenu = ({ open, onClose, categories }: MobileMenuProps) => {
  const user = useAuthStore((state) => state.user);
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const cartCount = useCartStore((state) => state.summary.count);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[80] overflow-y-auto bg-ink/96 backdrop-blur-2xl lg:hidden"
        >
          <div className="noise-overlay pointer-events-none absolute inset-0" />
          <div className="relative mx-auto flex min-h-full w-full max-w-xl flex-col px-6 pb-10 pt-5">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8">
              <SearchBar autoFocus={false} onSubmitted={onClose} large />
            </div>

            <nav className="mt-9 space-y-1" aria-label="Mobile navigation">
              {[
                { label: 'All products', to: '/shop' },
                { label: 'Collections', to: '/categories' },
                { label: 'About AURELIS', to: '/about' },
                { label: 'Contact', to: '/contact' },
              ].map((link, index) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * index + 0.08, duration: 0.4 }}
                >
                  <Link
                    to={link.to}
                    onClick={onClose}
                    className="group flex items-center justify-between border-b border-white/[0.06] py-4 text-[26px] font-medium tracking-[-0.03em] text-pearl"
                  >
                    {link.label}
                    <ArrowUpRight className="h-5 w-5 text-white/25 transition group-hover:text-accent" />
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="mt-9">
              <p className="eyebrow mb-4">Collections</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <Link
                    key={category._id}
                    to={`/shop?category=${category.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-[12px] text-white/65 transition hover:border-white/15 hover:text-white"
                  >
                    {category.name}
                    <span className="text-[10px] text-white/25">{category.productCount ?? 0}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-9 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-6">
              <Link
                to={user ? '/wishlist' : '/login'}
                onClick={onClose}
                className="flex flex-col items-center gap-2 rounded-2xl py-3 text-[10px] uppercase tracking-[0.14em] text-white/40 transition hover:bg-white/[0.04] hover:text-white"
              >
                <Heart className="h-4 w-4" /> Saved {wishlistCount > 0 ? `(${wishlistCount})` : ''}
              </Link>
              <Link
                to="/cart"
                onClick={onClose}
                className="flex flex-col items-center gap-2 rounded-2xl py-3 text-[10px] uppercase tracking-[0.14em] text-white/40 transition hover:bg-white/[0.04] hover:text-white"
              >
                <Package className="h-4 w-4" /> Bag {cartCount > 0 ? `(${cartCount})` : ''}
              </Link>
              <Link
                to={user ? '/profile' : '/login'}
                onClick={onClose}
                className="flex flex-col items-center gap-2 rounded-2xl py-3 text-[10px] uppercase tracking-[0.14em] text-white/40 transition hover:bg-white/[0.04] hover:text-white"
              >
                <UserRound className="h-4 w-4" /> {user ? 'Account' : 'Sign in'}
              </Link>
            </div>

            <p className="mt-auto pt-10 text-[10px] uppercase tracking-[0.24em] text-white/20">
              AURELIS · Technology, refined
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
