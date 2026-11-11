import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { resolveImage } from '@/utils/format';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&w=1400&q=85';

export const AuthLayout = () => {
  const location = useLocation();
  const reduced = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink">
      <ScrollToTop />
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 top-1/4 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(199,161,122,0.1),transparent_65%)] blur-3xl" />
        <div className="noise-overlay absolute inset-0" />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-[1.08fr_1fr]">
        <div className="relative hidden overflow-hidden border-r border-white/[0.06] lg:block">
          <img
            src={resolveImage(HERO_IMAGE)}
            alt="AURELIS titanium smartphone"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-ink/70 via-ink/30 to-ink" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/40" />
          <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
            <Logo />
            <div className="max-w-lg">
              <p className="eyebrow mb-5">Members receive more</p>
              <h1 className="text-[48px] leading-[1.02] tracking-[-0.045em] text-gradient-silver xl:text-[58px]">
                The considered side of technology.
              </h1>
              <p className="mt-6 max-w-md text-[14px] leading-relaxed text-white/45">
                Early access to private editions, priority concierge care and a wishlist that travels with you.
              </p>
              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
                {[
                  { icon: Truck, label: 'Complimentary delivery over $150' },
                  { icon: ShieldCheck, label: 'Two-year AURELIS warranty' },
                  { icon: Sparkles, label: 'Members-only releases' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 text-[11px] text-white/40">
                    <item.icon className="h-4 w-4 text-accent/70" strokeWidth={1.5} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[9px] uppercase tracking-[0.26em] text-white/20">Designed in California · Assembled with care</p>
          </div>
        </div>

        <div className="relative flex min-h-screen flex-col">
          <div className="flex items-center justify-between px-6 py-6 sm:px-10 lg:px-14">
            <div className="lg:hidden">
              <Logo />
            </div>
            <Link
              to="/"
              className="ml-auto inline-flex items-center gap-2 text-[11px] text-white/40 transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to store
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-6 pb-16 pt-6 sm:px-10 lg:px-14">
            <div className="w-full max-w-[420px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.pathname}
                  initial={reduced ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="px-6 pb-8 text-center sm:px-10 lg:px-14">
            <p className="text-[9px] uppercase tracking-[0.22em] text-white/20">
              © {new Date().getFullYear()} AURELIS · Privacy respected, always
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
