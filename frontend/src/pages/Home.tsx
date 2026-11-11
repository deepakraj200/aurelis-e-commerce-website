import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  Gem,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import type { Category, Product } from '@/types';
import { productService } from '@/services/productService';
import { useProducts } from '@/hooks/useProducts';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { resolveImage, formatMoney } from '@/utils/format';
import { Hero } from '@/components/home/Hero';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { RatingStars } from '@/components/ui/RatingStars';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Newsletter } from '@/components/marketing/Newsletter';
import { EmptyState } from '@/components/ui/EmptyState';

const ticker = [
  'Complimentary delivery over $150',
  '30-day considered returns',
  'Two-year AURELIS warranty',
  'Carbon-neutral delivery',
  'Concierge support, seven days',
];

const categoriesToShow = ['phones', 'audio', 'computing', 'wearables', 'imaging', 'accessories'];

const CollectionCard = ({ category, index }: { category: Category; index: number }) => {
  const reduced = useReducedMotion();
  const large = index < 2;

  return (
    <Reveal
      delay={index * 0.05}
      className={large ? 'lg:col-span-6' : 'lg:col-span-3'}
    >
      <Link
        to={`/shop?category=${category.slug}`}
        className={`group relative block overflow-hidden rounded-[26px] border border-white/[0.07] bg-graphite ${
          large ? 'h-[320px] sm:h-[380px]' : 'h-[240px] sm:h-[280px]'
        }`}
      >
        <motion.img
          src={resolveImage(category.image)}
          alt={category.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-[1.2s] ease-premium group-hover:scale-[1.05]"
          whileHover={reduced ? undefined : undefined}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/5" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/50 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-6 sm:p-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">
                {category.productCount ?? 0} pieces
              </p>
              <h3 className={`${large ? 'mt-2 text-[30px] sm:text-[36px]' : 'mt-2 text-[24px]'} font-medium tracking-[-0.04em] text-pearl`}>
                {category.name}
              </h3>
              {large && (
                <p className="mt-2 hidden max-w-[320px] text-[12px] leading-relaxed text-white/40 sm:block">
                  {category.description}
                </p>
              )}
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-ink/40 text-white/60 backdrop-blur-md transition group-hover:border-accent/40 group-hover:bg-accent/15 group-hover:text-accent-light">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
};

const BestSellers = ({ products }: { products: Product[] }) => (
  <div className="flex flex-col divide-y divide-white/[0.06]">
    {products.slice(0, 5).map((product, index) => (
      <Link
        key={product._id}
        to={`/product/${product.slug}`}
        className="group flex items-center gap-5 py-4 first:pt-0 last:pb-0"
      >
        <span className="w-7 shrink-0 text-[12px] tabular-nums text-white/20">0{index + 1}</span>
        <div className="h-[68px] w-[58px] shrink-0 overflow-hidden rounded-xl product-well">
          <img
            src={resolveImage(product.images[0])}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-pearl">{product.name}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <RatingStars rating={product.rating} size="xs" showValue={false} />
            <span className="text-[10px] text-white/30">{product.numReviews} reviews</span>
          </div>
        </div>
        <span className="shrink-0 text-[12px] tabular-nums text-white/55">
          {formatMoney(product.price, 'USD', false)}
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/20 transition group-hover:text-accent" />
      </Link>
    ))}
  </div>
);

const PromoBanners = ({ categories }: { categories: Category[] }) => {
  const picks = ['audio', 'imaging']
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter(Boolean) as Category[];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {picks.map((category, index) => (
        <Reveal key={category._id} delay={index * 0.08}>
          <Link
            to={`/shop?category=${category.slug}`}
            className="group relative block h-[300px] overflow-hidden rounded-[28px] border border-white/[0.07] sm:h-[340px]"
          >
            <img
              src={resolveImage(category.image)}
              alt={category.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-[0.55] transition-transform duration-[1.2s] group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
            <div className="relative flex h-full flex-col justify-between p-7">
              <span className="eyebrow">{index === 0 ? 'The sound of silence' : 'Capture the detail'}</span>
              <div>
                <h3 className="max-w-[300px] text-[27px] leading-[1.08] text-pearl sm:text-[32px]">
                  {index === 0 ? 'Hear the room differently.' : 'See what others miss.'}
                </h3>
                <p className="mt-2 max-w-[280px] text-[12px] leading-relaxed text-white/40">
                  {category.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-medium text-accent-light">
                  Explore {category.name}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
};

export const HomePage = () => {
  useDocumentTitle('');
  const { products, loading, error, refetch } = useProducts({ limit: 24, sort: 'newest' });
  const [categories, setCategories] = useState<Category[]>([]);
  const wishlistItems = useWishlistStore((state) => state.items);
  const cartItems = useCartStore((state) => state.items);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    productService.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const orderedCategories = useMemo(() => {
    return categoriesToShow
      .map((slug) => categories.find((category) => category.slug === slug))
      .filter(Boolean) as Category[];
  }, [categories]);

  const heroProduct = useMemo(
    () => products.find((product) => product.slug === 'titan-x-pro') || products.find((product) => product.featured) || products[0],
    [products]
  );

  const trending = useMemo(
    () => [...products].sort((a, b) => b.rating * b.numReviews - a.rating * a.numReviews).slice(0, 8),
    [products]
  );

  const newArrivals = useMemo(
    () =>
      [...products]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4),
    [products]
  );

  const bestSellers = useMemo(() => [...products].sort((a, b) => b.sold - a.sold).slice(0, 5), [products]);

  const recommendations = useMemo(() => {
    const interestSlugs = new Set<string>();
    [...wishlistItems, ...cartItems.map((item) => item.product)].forEach((product) => {
      const category = typeof product.category === 'object' ? product.category.slug : '';
      if (category) interestSlugs.add(category);
    });

    let pool = products.filter((product) => {
      const category = typeof product.category === 'object' ? product.category.slug : '';
      return interestSlugs.size === 0 || interestSlugs.has(category);
    });
    pool = pool.filter((product) => product._id !== heroProduct?._id);
    if (pool.length < 4) {
      pool = products.filter((product) => product._id !== heroProduct?._id);
    }
    return [...pool].sort((a, b) => b.rating - a.rating).slice(0, 4);
  }, [products, wishlistItems, cartItems, heroProduct]);

  const promoProduct = useMemo(
    () => products.find((product) => product.slug === 'optic-m1') || products.find((product) => product.featured),
    [products]
  );

  return (
    <div className="pb-4">
      <Hero product={heroProduct} loading={loading && products.length === 0} />

      <div className="container-premium mt-6 overflow-hidden">
        <div className="mask-fade-x flex items-center gap-8 overflow-hidden border-y border-white/[0.06] py-3.5">
          {ticker.map((item) => (
            <div key={item} className="flex shrink-0 items-center gap-8 text-[9px] uppercase tracking-[0.2em] text-white/25">
              <span>{item}</span>
              <span className="h-1 w-1 rounded-full bg-accent/50" />
            </div>
          ))}
        </div>
      </div>

      <section className="container-premium pt-20 sm:pt-28">
        <SectionHeading
          eyebrow="Curated worlds"
          title="Find your field of focus."
          description="Six collections, each built around a single idea: that technology should feel inevitable in the hand."
          link="/categories"
          linkLabel="All collections"
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-12">
          {orderedCategories.slice(0, 2).map((category, index) => (
            <CollectionCard key={category._id} category={category} index={index} />
          ))}
          {orderedCategories.slice(2).map((category, index) => (
            <CollectionCard key={category._id} category={category} index={index + 2} />
          ))}
        </div>
      </section>

      <section className="container-premium pt-20 sm:pt-28">
        <SectionHeading
          eyebrow="The moment"
          title="Trending now."
          description="What the AURELIS community is considering this week."
          link="/shop?sort=popular"
          linkLabel="Shop all"
        />
        {error ? (
          <div className="mt-10">
            <EmptyState
              icon={RefreshCcw}
              title="The collection could not load"
              description={error}
              action={<Button onClick={refetch}>Try again</Button>}
            />
          </div>
        ) : loading ? (
          <div className="mt-10">
            <ProductGridSkeleton count={4} />
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {trending.map((product, index) => (
              <Reveal key={product._id} delay={(index % 4) * 0.05}>
                <ProductCard product={product} priority={index < 2} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {promoProduct && (
        <section className="container-premium pt-20 sm:pt-28">
          <Reveal>
            <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#0b0b0d] sm:rounded-[36px]">
              <div className="grid min-h-[420px] lg:grid-cols-[1.02fr_0.98fr]">
                <div className="relative order-2 flex items-center justify-center overflow-hidden p-8 sm:p-12 lg:order-1">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_40%,rgba(199,161,122,0.18),transparent_60%)]" />
                  <div className="relative aspect-[5/4] w-full max-w-[430px] overflow-hidden rounded-[24px] product-well shadow-lift">
                    <img
                      src={resolveImage(promoProduct.images[0])}
                      alt={promoProduct.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="glass absolute bottom-6 right-6 hidden rounded-2xl px-4 py-3 sm:block">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-white/30">Full-frame · 8K</p>
                    <p className="mt-1 text-[12px] text-pearl">{promoProduct.name}</p>
                  </div>
                </div>
                <div className="order-1 flex flex-col justify-center px-7 py-12 sm:px-12 lg:order-2 lg:pr-16">
                  <p className="eyebrow mb-4">AURELIS Imaging</p>
                  <h2 className="max-w-[420px] text-[34px] leading-[1.05] text-pearl sm:text-[46px]">
                    Light, precisely understood.
                  </h2>
                  <p className="mt-5 max-w-[400px] text-[13px] leading-relaxed text-white/42">
                    The {promoProduct.name} pairs a 61-megapixel full-frame sensor with 8K cinema and eight stops of
                    stabilisation. Made for the photograph you can already see.
                  </p>
                  <div className="mt-7 flex items-center gap-5">
                    <span className="text-[20px] font-medium text-pearl">{formatMoney(promoProduct.price, 'USD', false)}</span>
                    <span className="h-4 w-px bg-white/15" />
                    <RatingStars rating={promoProduct.rating} count={promoProduct.numReviews} />
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link to={`/product/${promoProduct.slug}`} className={buttonStyles('primary', 'md')}>
                      Discover {promoProduct.name} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link to="/shop?category=imaging" className={buttonStyles('outline', 'md')}>
                      The imaging collection
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      <section className="container-premium pt-20 sm:pt-28">
        <SectionHeading
          eyebrow="Just arrived"
          title="New to the collection."
          link="/shop?sort=newest"
          linkLabel="View all"
        />
        {loading ? (
          <div className="mt-10">
            <ProductGridSkeleton count={4} />
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {newArrivals.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="container-premium pt-20 sm:pt-28">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <p className="eyebrow mb-4">The most considered</p>
              <h2 className="max-w-[330px] text-[34px] leading-[1.06] text-pearl sm:text-[44px]">
                Objects people return to.
              </h2>
              <p className="mt-4 max-w-[320px] text-[13px] leading-relaxed text-white/38">
                Ranked by the AURELIS community — measured in repeat purchases, not impressions.
              </p>
              <Link to="/shop?sort=popular" className={buttonStyles('outline', 'md', 'mt-7')}>
                Shop bestsellers <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-[28px] border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-white/[0.012] p-6 sm:p-8">
              <div className="mb-5 flex items-center justify-between border-b border-white/[0.07] pb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">Rank · Piece</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">Price</span>
              </div>
              <BestSellers products={bestSellers} />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-premium pt-20 sm:pt-28">
        <PromoBanners categories={categories} />
      </section>

      <section className="container-premium pt-20 sm:pt-28">
        <SectionHeading
          eyebrow={user ? `Selected for ${user.name.split(' ')[0]}` : 'Considered for you'}
          title="A quieter kind of recommendation."
          description="Shaped by what you have saved and considered — never by what shouts loudest."
          link="/shop"
          linkLabel="Browse everything"
        />
        {loading ? (
          <div className="mt-10">
            <ProductGridSkeleton count={4} />
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {recommendations.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="container-premium pt-24 sm:pt-32">
        <Reveal>
          <div className="relative overflow-hidden rounded-[36px] border border-white/[0.07] bg-[#0a0a0c] px-6 py-16 text-center sm:px-14 sm:py-24">
            <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(199,161,122,0.15),transparent_65%)] blur-2xl" />
            <div className="noise-overlay absolute inset-0" />
            <div className="relative">
              <Sparkles className="mx-auto mb-7 h-5 w-5 text-accent/70" strokeWidth={1.4} />
              <h2 className="mx-auto max-w-[760px] text-[36px] leading-[1.04] tracking-[-0.04em] text-gradient-silver sm:text-[58px]">
                Engineered to disappear. Designed to remain.
              </h2>
              <p className="mx-auto mt-6 max-w-[440px] text-[13px] leading-relaxed text-white/38">
                We make fewer things, more carefully. Every material is chosen for how it ages, every surface for
                how it feels after the thousandth touch.
              </p>
              <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 divide-x divide-white/[0.08]">
                {[
                  { icon: Gem, value: 'Grade 5', label: 'Titanium' },
                  { icon: ShieldCheck, value: '2 years', label: 'Warranty' },
                  { icon: Box, value: '30 days', label: 'To decide' },
                ].map((stat) => (
                  <div key={stat.label} className="px-3">
                    <stat.icon className="mx-auto mb-3 h-4 w-4 text-accent/60" strokeWidth={1.5} />
                    <p className="text-[20px] font-medium text-pearl sm:text-[24px]">{stat.value}</p>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/28">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="container-premium pt-20 sm:pt-28">
        <div className="grid overflow-hidden rounded-[32px] border border-white/[0.07] bg-gradient-to-br from-white/[0.05] to-white/[0.015] lg:grid-cols-[1fr_0.85fr]">
          <div className="p-8 sm:p-12">
            <Newsletter />
          </div>
          <div className="relative hidden min-h-[280px] overflow-hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80"
              alt="AURELIS Chrono S"
              loading="lazy"
              className="h-full w-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0f] via-transparent to-ink/20" />
            <div className="absolute bottom-7 right-7 flex items-center gap-2 rounded-full border border-white/10 bg-ink/50 px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-white/50 backdrop-blur-xl">
              <Truck className="h-3.5 w-3.5" /> Delivered with care
            </div>
          </div>
        </div>
      </section>

      <div className="mt-16 flex items-center justify-center gap-3 text-[9px] uppercase tracking-[0.24em] text-white/15 sm:mt-20">
        <span className="h-px w-8 bg-white/10" /> AURELIS · Technology, refined <span className="h-px w-8 bg-white/10" />
      </div>
    </div>
  );
};
