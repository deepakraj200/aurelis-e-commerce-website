import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Star } from 'lucide-react';
import type { Product } from '@/types';
import { formatMoney, resolveImage } from '@/utils/format';
import { buttonStyles } from '@/components/ui/Button';
import { ProductImage } from '@/components/product/ProductImage';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1600&q=85';

export const Hero = ({ product, loading }: { product?: Product; loading: boolean }) => {
  const reduced = useReducedMotion();
  const image = product?.images?.[0] || FALLBACK_IMAGE;
  const price = product?.price ?? 1299;

  return (
    <section className="container-premium">
      <div className="relative isolate min-h-[690px] overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#0a0a0c] sm:min-h-[720px] sm:rounded-[40px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_35%,rgba(199,161,122,0.16),transparent_55%)]" />

        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-y-0 right-0 w-full lg:w-[72%]"
        >
          <div className="relative h-full w-full overflow-hidden">
            {product ? (
              <ProductImage
                src={image}
                alt={product.name}
                priority
                imgClassName="object-cover object-center opacity-[0.68] saturate-[0.95]"
              />
            ) : (
              <img
                src={resolveImage(FALLBACK_IMAGE)}
                alt="AURELIS Titan X Pro"
                className="h-full w-full object-cover opacity-60"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/65 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-[#0a0a0c]/40" />
          </div>
        </motion.div>

        <div className="relative z-10 flex min-h-[690px] flex-col justify-end px-6 pb-10 pt-16 sm:min-h-[720px] sm:px-10 sm:pb-14 lg:justify-center lg:px-16 lg:pb-16">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[600px] lg:pt-10"
          >
            <div className="mb-6 flex items-center gap-3">
              <span className="rounded-full border border-accent/25 bg-accent/[0.07] px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.2em] text-accent-light backdrop-blur-md">
                New arrival
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">The Titan collection</span>
            </div>

            <h1 className="text-[48px] leading-[0.96] tracking-[-0.05em] text-pearl sm:text-[70px] lg:text-[82px]">
              Titanium,
              <br />
              <span className="text-gradient-accent">elevated.</span>
            </h1>

            <p className="mt-6 max-w-[440px] text-[14px] leading-[1.75] text-white/45 sm:text-[15px]">
              Aerospace-grade titanium. The A1 Pro chip. A camera that finds light in the dark. The most
              considered phone we have ever made — now with up to 33 hours of power.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to={product ? `/product/${product.slug}` : '/shop'}
                className={buttonStyles('primary', 'lg', 'min-w-[190px]')}
              >
                Shop {product?.name || 'the collection'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
              </Link>
              <Link to="/shop" className={buttonStyles('outline', 'lg')}>
                Explore all products
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] uppercase tracking-[0.15em] text-white/28">
              <span>From {formatMoney(price, 'USD', false)}</span>
              <span className="h-3 w-px bg-white/15" />
              <span>Complimentary delivery</span>
              <span className="h-3 w-px bg-white/15" />
              <span>2-year warranty</span>
            </div>
          </motion.div>

          {product && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="ml-auto mt-12 w-full max-w-[310px] lg:absolute lg:bottom-10 lg:right-10 lg:mt-0"
            >
              <Link
                to={`/product/${product.slug}`}
                className="glass group flex items-center gap-3.5 rounded-2xl p-3.5 transition hover:bg-white/[0.09]"
              >
                <div className="h-[64px] w-[54px] shrink-0 overflow-hidden rounded-xl product-well">
                  <ProductImage src={product.images[0]} alt="" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/30">Featured</p>
                  <p className="mt-1 truncate text-[13px] font-medium text-pearl">{product.name}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    <span className="text-[10px] text-white/40">
                      {product.rating ? product.rating.toFixed(1) : 'New'} · {formatMoney(product.price, 'USD', false)}
                    </span>
                  </div>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/50 transition group-hover:border-accent/30 group-hover:text-accent">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </motion.div>
          )}
        </div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
            <span className="text-[10px] uppercase tracking-[0.24em] text-white/40">Preparing the collection</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </section>
  );
};
