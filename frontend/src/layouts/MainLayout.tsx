import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { ActivityIsland } from '@/components/layout/ActivityIsland';
import { QuickViewModal } from '@/components/product/QuickViewModal';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { useCartStore } from '@/store/cartStore';
import { useUiStore } from '@/store/uiStore';

export const MainLayout = () => {
  const location = useLocation();
  const reduced = useReducedMotion();
  const setCartOpen = useCartStore((state) => state.setDrawerOpen);
  const closeQuickView = useUiStore((state) => state.closeQuickView);

  useEffect(() => {
    setCartOpen(false);
    closeQuickView();
  }, [location.pathname, setCartOpen, closeQuickView]);

  return (
    <div className="relative min-h-screen bg-ink">
      <ScrollToTop />
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-pearl px-5 py-3 text-[12px] font-semibold text-ink transition focus:translate-y-0"
      >
        Skip to content
      </a>

      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[28rem] left-1/2 h-[60rem] w-[80rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(199,161,122,0.12),transparent_62%)] blur-2xl" />
        <div className="absolute right-[-18rem] top-[30rem] h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle,rgba(120,132,160,0.08),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-0 left-[-20rem] h-[40rem] w-[50rem] rounded-full bg-[radial-gradient(circle,rgba(199,161,122,0.06),transparent_65%)] blur-3xl" />
        <div className="noise-overlay absolute inset-0" />
      </div>

      <div className="relative z-10">
        <Navbar />
        <ActivityIsland />
        <main id="main-content" className="min-h-[70vh] pt-[88px] sm:pt-[104px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>

      <CartDrawer />
      <QuickViewModal />
    </div>
  );
};
