import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Heart, Menu, Search, ShoppingBag } from 'lucide-react';
import type { Category } from '@/types';
import { productService } from '@/services/productService';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { cn } from '@/utils/cn';
import { NAV_LINKS } from '@/utils/constants';
import { Logo } from '@/components/ui/Logo';
import { SearchBar } from './SearchBar';
import { AccountMenu } from './AccountMenu';
import { MobileMenu } from './MobileMenu';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative rounded-full px-4 py-2 text-[12px] transition-colors duration-300',
    isActive ? 'text-pearl' : 'text-white/45 hover:text-white/85'
  );

export const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const cartCount = useCartStore((state) => state.summary.count);
  const setCartOpen = useCartStore((state) => state.setDrawerOpen);
  const wishlistCount = useWishlistStore((state) => state.items.length);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    productService.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setCollectionsOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const openCollections = () => {
    clearTimeout(closeTimer.current);
    setCollectionsOpen(true);
  };
  const closeCollections = () => {
    closeTimer.current = setTimeout(() => setCollectionsOpen(false), 180);
  };

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 pt-3 sm:pt-4">
        <div className="container-premium">
          <motion.div
            animate={{
              backgroundColor: scrolled ? 'rgba(10,10,12,0.82)' : 'rgba(15,15,17,0.5)',
              boxShadow: scrolled
                ? '0 30px 70px -30px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.09)'
                : '0 16px 50px -30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07)',
            }}
            transition={{ duration: 0.4 }}
            className="pointer-events-auto flex h-[60px] items-center gap-3 rounded-full border border-white/[0.08] px-3 backdrop-blur-2xl sm:h-16 sm:gap-4 sm:px-5"
          >
            <div className="shrink-0">
              <div className="hidden sm:block">
                <Logo />
              </div>
              <div className="sm:hidden">
                <Logo compact />
              </div>
            </div>

            <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
              {NAV_LINKS.filter((link) => ['Shop', 'Collections'].includes(link.label)).map((link) =>
                link.label === 'Collections' ? (
                  <div
                    key={link.to}
                    className="relative"
                    onMouseEnter={openCollections}
                    onMouseLeave={closeCollections}
                  >
                    <button
                      type="button"
                      onClick={() => setCollectionsOpen((value) => !value)}
                      aria-expanded={collectionsOpen}
                      className={cn(navLinkClass({ isActive: location.pathname === '/categories' }), 'inline-flex items-center gap-1')}
                    >
                      Collections
                      <ChevronDown className={cn('h-3 w-3 transition', collectionsOpen && 'rotate-180')} />
                    </button>
                    <AnimatePresence>
                      {collectionsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.99 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                          className="glass-strong absolute left-0 top-11 w-[430px] rounded-2xl p-3"
                        >
                          <div className="grid grid-cols-2 gap-1">
                            {categories.map((category) => (
                              <Link
                                key={category._id}
                                to={`/shop?category=${category.slug}`}
                                onClick={() => setCollectionsOpen(false)}
                                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[12px] text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                              >
                                {category.name}
                                <span className="text-[10px] tabular-nums text-white/25">{category.productCount ?? 0}</span>
                              </Link>
                            ))}
                          </div>
                          <div className="mt-2 flex items-center justify-between border-t border-white/[0.07] px-3 pb-1 pt-3">
                            <span className="text-[10px] uppercase tracking-[0.18em] text-white/25">Curated technology</span>
                            <Link
                              to="/categories"
                              onClick={() => setCollectionsOpen(false)}
                              className="text-[11px] text-accent-light transition hover:text-accent"
                            >
                              View all collections
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <NavLink key={link.to} to={link.to} className={navLinkClass}>
                    {link.label}
                  </NavLink>
                )
              )}
            </nav>

            <div className="mx-auto hidden max-w-[360px] flex-1 md:block">
              <SearchBar />
            </div>

            <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
              <Link
                to="/search"
                aria-label="Search"
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/65 transition hover:bg-white/[0.06] hover:text-white md:hidden"
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </Link>
              <Link
                to="/wishlist"
                aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ''}`}
                className="relative hidden h-10 w-10 items-center justify-center rounded-full text-white/65 transition hover:bg-white/[0.06] hover:text-white sm:flex"
              >
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.7} />
                {wishlistCount > 0 && (
                  <motion.span
                    key={wishlistCount}
                    initial={{ scale: 0.4 }}
                    animate={{ scale: 1 }}
                    className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[8px] font-bold text-ink"
                  >
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </motion.span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                aria-label={`Shopping bag${cartCount ? `, ${cartCount} items` : ''}`}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-white/65 transition hover:bg-white/[0.06] hover:text-white"
              >
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.7} />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.4 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pearl px-1 text-[8px] font-bold text-ink"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </button>
              <div className="ml-1 hidden sm:block">
                <AccountMenu />
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="ml-0.5 flex h-10 w-10 items-center justify-center rounded-full text-white/65 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
              >
                <Menu className="h-5 w-5" strokeWidth={1.7} />
              </button>
            </div>
          </motion.div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} categories={categories} />
    </>
  );
};
