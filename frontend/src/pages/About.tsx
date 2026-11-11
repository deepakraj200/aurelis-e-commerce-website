import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CircleDot,
  Compass,
  Feather,
  Leaf,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Truck,
  Wrench,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageIntro } from '@/components/ui/PageIntro';
import { Reveal } from '@/components/ui/Reveal';
import { buttonStyles } from '@/components/ui/Button';
import { resolveImage } from '@/utils/format';

const pillars = [
  {
    icon: CircleDot,
    title: 'Material honesty',
    copy: 'Titanium looks like titanium. Aluminium is left to age. We choose materials for how they feel after a thousand touches, not how they photograph on day one.',
  },
  {
    icon: Compass,
    title: 'Software that recedes',
    copy: 'The best interface is the one you stop noticing. Every animation, label and setting earns its place or leaves the room.',
  },
  {
    icon: Wrench,
    title: 'Repair over replace',
    copy: 'Modular batteries, published guides and a two-year warranty. An object you keep is the most sustainable object there is.',
  },
];

const services = [
  {
    id: 'shipping',
    icon: Truck,
    title: 'Shipping',
    copy: 'Complimentary standard delivery on orders over $150. Below that, a flat $12 fee applies. Orders are dispatched from our studio within one to two business days, with tracking shared the moment your piece leaves us.',
  },
  {
    id: 'returns',
    icon: RefreshCcw,
    title: 'Returns & exchanges',
    copy: 'Live with it for 30 days. If a piece is not right, start a return from your order page and we will arrange collection. Items should be in their original condition; exchanges ship as soon as the return is scanned.',
  },
  {
    id: 'warranty',
    icon: ShieldCheck,
    title: 'AURELIS Care',
    copy: 'Every product includes two years of hardware coverage and priority concierge support. Repairs use genuine components and are performed by AURELIS-trained technicians. Accidental damage is quoted transparently before any work begins.',
  },
];

export const AboutPage = () => {
  useDocumentTitle('Our story');

  return (
    <div className="pb-10">
      <div className="container-premium pt-10 sm:pt-14">
        <PageIntro
          eyebrow="Since 2019 · San Francisco"
          title="Technology, in its quietest form."
          description="AURELIS exists for the people who notice. A softer click. A seam that disappears. The half-gram of weight removed from a hinge. We make fewer objects, more slowly, because the small things are the product."
          actions={
            <Link to="/shop" className={buttonStyles('outline', 'md')}>
              Explore the collection <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />

        <div className="relative mt-10 overflow-hidden rounded-[32px] border border-white/[0.08]">
          <img
            src={resolveImage('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1800&q=85')}
            alt="AURELIS studio still life"
            className="h-[360px] w-full object-cover opacity-70 sm:h-[520px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-5 sm:bottom-10 sm:left-10 sm:right-10">
            <div>
              <p className="text-[9px] uppercase tracking-[0.22em] text-white/35">Studio No. 04 · San Francisco</p>
              <p className="mt-2 max-w-md text-[18px] leading-snug text-pearl sm:text-[24px]">
                “We are not trying to make the loudest object in the room. Only the one you reach for.”
              </p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/30">Mara Ellison · Founder</span>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 divide-x divide-white/[0.07] border-y border-white/[0.07] py-8 sm:grid-cols-4">
          {[
            { value: '2019', label: 'Founded in California' },
            { value: '16', label: 'Pieces, deliberately' },
            { value: '2 years', label: 'Standard warranty' },
            { value: '94%', label: 'Recycled aluminium' },
          ].map((stat) => (
            <div key={stat.label} className="px-4 text-center first:pl-0 last:pr-0">
              <p className="text-[26px] font-medium tracking-[-0.04em] text-pearl sm:text-[32px]">{stat.value}</p>
              <p className="mt-1.5 text-[9px] uppercase tracking-[0.18em] text-white/25">{stat.label}</p>
            </div>
          ))}
        </div>

        <section id="philosophy" className="scroll-mt-28 pt-20 sm:pt-28">
          <Reveal>
            <p className="eyebrow mb-4">Our philosophy</p>
            <h2 className="max-w-3xl text-[34px] leading-[1.05] text-pearl sm:text-[48px]">
              Fewer surfaces. More intention.
            </h2>
            <p className="mt-5 max-w-2xl text-[14px] leading-[1.85] text-white/40">
              Most technology asks for attention. We begin with the opposite question: what can be removed? What can
              be quieter, warmer, more legible? The result is a catalogue of sixteen pieces — each one designed to
              disappear into a life rather than interrupt it.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {pillars.map((pillar, index) => (
              <Reveal key={pillar.title} delay={index * 0.08}>
                <div className="group h-full rounded-[24px] border border-white/[0.07] bg-white/[0.022] p-7 transition hover:border-white/[0.14]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-accent/80">
                    <pillar.icon className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <h3 className="mt-6 text-[18px] text-pearl">{pillar.title}</h3>
                  <p className="mt-3 text-[12px] leading-[1.8] text-white/38">{pillar.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="pt-20 sm:pt-28">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <div className="grid grid-cols-2 gap-3">
                <div className="overflow-hidden rounded-[24px] border border-white/[0.07]">
                  <img
                    src={resolveImage('https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80')}
                    alt="Lumen Book Pro at work"
                    loading="lazy"
                    className="h-[300px] w-full object-cover"
                  />
                </div>
                <div className="mt-10 overflow-hidden rounded-[24px] border border-white/[0.07]">
                  <img
                    src={resolveImage('https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80')}
                    alt="Chrono S detail"
                    loading="lazy"
                    className="h-[300px] w-full object-cover"
                  />
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="eyebrow mb-4">Craft</p>
              <h2 className="text-[32px] leading-[1.06] text-pearl sm:text-[42px]">Made by people who notice.</h2>
              <p className="mt-5 text-[13px] leading-[1.85] text-white/42">
                Our studio sits above a machine shop on the edge of San Francisco. Designers and engineers share the
                same benches, which means a sketch is often a machined part by the end of the week. We prototype in
                aluminium before titanium, and we hold a piece for months before it earns a place in the catalogue.
              </p>
              <p className="mt-4 text-[13px] leading-[1.85] text-white/42">
                Every AURELIS object is assembled and inspected by hand. The serial number on the back is not a
                marketing gesture; it is how we know who built it and how to care for it years later.
              </p>
              <div className="mt-7 grid grid-cols-2 gap-4">
                {[
                  { icon: Feather, label: 'Hand finished' },
                  { icon: Boxes, label: 'Plastic-free packaging' },
                  { icon: Sparkles, label: 'Individually inspected' },
                  { icon: PackageCheck, label: 'Serial numbered' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 text-[11px] text-white/40">
                    <item.icon className="h-3.5 w-3.5 text-accent/60" /> {item.label}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section id="sustainability" className="scroll-mt-28 pt-20 sm:pt-28">
          <Reveal>
            <div className="relative overflow-hidden rounded-[32px] border border-white/[0.07] bg-[linear-gradient(120deg,#0f1410_0%,#152018_55%,#0a0d0b_100%)] p-8 sm:p-14">
              <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(120,160,120,0.16),transparent_65%)] blur-2xl" />
              <Leaf className="mb-6 h-5 w-5 text-emerald-300/70" strokeWidth={1.5} />
              <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="eyebrow !text-emerald-300/70">Sustainability</p>
                  <h2 className="mt-4 max-w-xl text-[30px] leading-[1.08] text-pearl sm:text-[40px]">
                    An object you keep is the greenest object there is.
                  </h2>
                </div>
                <div className="space-y-4 text-[12px] leading-[1.85] text-white/38">
                  <p>
                    We do not release a new model every year. Our cases are 94% recycled aluminium and our packaging
                    contains no plastic. Spare parts are stocked for at least seven years.
                  </p>
                  <p>
                    Deliveries are carbon neutral. Returns are consolidated rather than shipped individually. And
                    every repair keeps one more object in use — which is always better than a new one.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="pt-20 sm:pt-28">
          <Reveal>
            <p className="eyebrow mb-4">Client care</p>
            <h2 className="text-[30px] leading-tight text-pearl sm:text-[38px]">The details after you buy.</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {services.map((service, index) => (
              <Reveal key={service.id} delay={index * 0.06}>
                <div id={service.id} className="h-full scroll-mt-28 rounded-[24px] border border-white/[0.07] bg-white/[0.022] p-7">
                  <service.icon className="h-5 w-5 text-accent/70" strokeWidth={1.5} />
                  <h3 className="mt-5 text-[18px] text-pearl">{service.title}</h3>
                  <p className="mt-3 text-[12px] leading-[1.8] text-white/38">{service.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="pt-20 sm:pt-28">
          <Reveal>
            <div className="flex flex-col items-center rounded-[32px] border border-white/[0.07] bg-[#0a0a0c] px-6 py-14 text-center sm:px-12">
              <p className="eyebrow mb-4">The next step</p>
              <h2 className="max-w-xl text-[30px] leading-tight text-pearl sm:text-[40px]">
                Begin with one considered thing.
              </h2>
              <p className="mt-4 max-w-md text-[12px] leading-relaxed text-white/35">
                Browse the collection, or tell us what you are looking for. A real person will write back.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link to="/shop" className={buttonStyles('primary', 'md')}>
                  Explore the shop <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link to="/contact" className={buttonStyles('outline', 'md')}>
                  Contact the studio <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
};
