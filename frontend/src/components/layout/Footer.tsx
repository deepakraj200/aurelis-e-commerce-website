import { Link } from 'react-router-dom';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Newsletter } from '@/components/marketing/Newsletter';

const collections = [
  { label: 'Phones', to: '/shop?category=phones' },
  { label: 'Audio', to: '/shop?category=audio' },
  { label: 'Wearables', to: '/shop?category=wearables' },
  { label: 'Computing', to: '/shop?category=computing' },
  { label: 'Imaging', to: '/shop?category=imaging' },
  { label: 'Accessories', to: '/shop?category=accessories' },
];

const company = [
  { label: 'Our story', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Design philosophy', to: '/about#philosophy' },
  { label: 'Sustainability', to: '/about#sustainability' },
];

const clientCare = [
  { label: 'Shipping', to: '/about#shipping' },
  { label: 'Returns & exchanges', to: '/about#returns' },
  { label: 'Warranty', to: '/about#warranty' },
  { label: 'Track an order', to: '/orders' },
];

export const Footer = () => (
  <footer className="relative mt-24 border-t border-white/[0.06] bg-[#08080a]">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    <div className="container-premium">
      <div className="grid gap-10 border-b border-white/[0.06] py-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 lg:py-20">
        <div className="flex flex-col justify-between gap-10">
          <div>
            <Logo />
            <p className="mt-6 max-w-sm text-[13px] leading-relaxed text-white/35">
              AURELIS creates quietly extraordinary technology in titanium, aluminium and glass. Designed to be
              understood at a glance and kept for years.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-[11px] text-white/35">
            <a href="mailto:concierge@aurelis.com" className="inline-flex items-center gap-2 transition hover:text-white">
              <Mail className="h-3.5 w-3.5" /> concierge@aurelis.com
            </a>
            <a href="tel:+14155550190" className="inline-flex items-center gap-2 transition hover:text-white">
              <Phone className="h-3.5 w-3.5" /> +1 415 555 0190
            </a>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> San Francisco · Tokyo
            </span>
          </div>
        </div>
        <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.025] p-6 sm:p-8">
          <Newsletter />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
        <div>
          <h3 className="mb-5 text-[10px] font-medium uppercase tracking-[0.24em] text-white/30">Collections</h3>
          <ul className="space-y-3">
            {collections.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-[12px] text-white/50 transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-5 text-[10px] font-medium uppercase tracking-[0.24em] text-white/30">Company</h3>
          <ul className="space-y-3">
            {company.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-[12px] text-white/50 transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-5 text-[10px] font-medium uppercase tracking-[0.24em] text-white/30">Client care</h3>
          <ul className="space-y-3">
            {clientCare.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-[12px] text-white/50 transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-5 text-[10px] font-medium uppercase tracking-[0.24em] text-white/30">Your account</h3>
          <ul className="space-y-3">
            {[
              { label: 'Profile', to: '/profile' },
              { label: 'My orders', to: '/orders' },
              { label: 'Wishlist', to: '/wishlist' },
              { label: 'Shopping bag', to: '/cart' },
            ].map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-[12px] text-white/50 transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center gap-1.5 text-[11px] text-accent-light transition hover:text-accent"
          >
            Book a consultation <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-5 border-t border-white/[0.06] py-7 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">
          © {new Date().getFullYear()} AURELIS · Technology, refined
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {['Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Stripe'].map((method) => (
            <span
              key={method}
              className="rounded-md border border-white/[0.08] px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-white/30"
            >
              {method}
            </span>
          ))}
          <span className="ml-2 text-[9px] uppercase tracking-[0.16em] text-white/20">Secure payments</span>
        </div>
      </div>
    </div>
  </footer>
);
