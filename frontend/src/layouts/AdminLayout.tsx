import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  LayoutDashboard,
  Menu,
  Package,
  ReceiptText,
  Users,
  X,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { AccountMenu } from '@/components/layout/AccountMenu';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';
import { initials } from '@/utils/format';
import { ScrollToTop } from '@/components/common/ScrollToTop';

const links = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ReceiptText },
  { to: '/admin/customers', label: 'Customers', icon: Users },
];

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const user = useAuthStore((state) => state.user);
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-8 pt-7">
        <Logo />
        <p className="mt-6 text-[9px] uppercase tracking-[0.26em] text-accent">Admin Studio</p>
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Admin navigation">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-[12px] transition',
                isActive
                  ? 'bg-white/[0.07] text-pearl'
                  : 'text-white/40 hover:bg-white/[0.035] hover:text-white/75'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="admin-nav-active"
                    className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-accent"
                  />
                )}
                <link.icon className="h-4 w-4" strokeWidth={1.6} />
                {link.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mx-3 mb-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">Signed in as</p>
        <div className="mt-3 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-light to-accent-deep text-[10px] font-semibold text-[#1b140d]">
            {initials(user?.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] text-white/75">{user?.name}</p>
            <p className="truncate text-[9px] text-white/30">Administrator</p>
          </div>
        </div>
        <Link
          to="/"
          onClick={onNavigate}
          className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3 text-[10px] uppercase tracking-[0.12em] text-white/35 transition hover:text-white"
        >
          View storefront <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export const AdminLayout = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#070708] text-pearl">
      <ScrollToTop />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 right-0 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(199,161,122,0.08),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-[30rem] w-[40rem] rounded-full bg-[radial-gradient(circle,rgba(110,120,150,0.05),transparent_65%)] blur-3xl" />
        <div className="noise-overlay absolute inset-0" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-white/[0.06] bg-[#09090b]/90 backdrop-blur-2xl lg:block">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              aria-label="Close admin menu"
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong absolute inset-y-0 left-0 w-[272px]"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="absolute right-4 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/50"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="relative z-10 lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#070708]/80 backdrop-blur-2xl">
          <div className="flex h-[68px] items-center justify-between gap-4 px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open admin menu"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/65 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-[9px] uppercase tracking-[0.22em] text-white/25">AURELIS</p>
                <p className="text-[13px] font-medium text-white/80">Commerce Studio</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="mr-2 hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] text-emerald-300/80 sm:flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
              </span>
              <AccountMenu />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
