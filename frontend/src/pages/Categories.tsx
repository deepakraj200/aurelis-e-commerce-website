import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, PackageSearch } from 'lucide-react';
import type { Category } from '@/types';
import { productService } from '@/services/productService';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { resolveImage } from '@/utils/format';
import { PageIntro } from '@/components/ui/PageIntro';
import { Reveal } from '@/components/ui/Reveal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { buttonStyles } from '@/components/ui/Button';

export const CategoriesPage = () => {
  useDocumentTitle('Collections');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    productService
      .categories()
      .then(setCategories)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-premium pb-10 pt-10 sm:pt-14">
      <PageIntro
        eyebrow="The AURELIS worlds"
        title="Six ways to look at technology."
        description="Each collection is built around a distinct discipline — sound, time, light, computation. Together they form a complete, considered environment."
        actions={<Link to="/shop" className={buttonStyles('outline', 'md')}>Browse all pieces <ArrowRight className="h-3.5 w-3.5" /></Link>}
      />

      {loading ? (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((entry) => <Skeleton key={entry} className="h-[360px] rounded-[28px]" />)}
        </div>
      ) : error ? (
        <div className="mt-10">
          <EmptyState
            icon={PackageSearch}
            title="Collections are taking a moment"
            description="We could not load the collection index. Please refresh to try again."
            action={<button type="button" onClick={() => window.location.reload()} className={buttonStyles('primary', 'md')}>Refresh</button>}
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {categories.map((category, index) => (
            <Reveal key={category._id} delay={(index % 2) * 0.06}>
              <Link
                to={`/shop?category=${category.slug}`}
                className={`group relative block overflow-hidden rounded-[28px] border border-white/[0.07] ${
                  index < 2 ? 'h-[420px] sm:h-[480px]' : 'h-[360px]'
                }`}
              >
                <img
                  src={resolveImage(category.image)}
                  alt={category.name}
                  loading={index < 2 ? 'eager' : 'lazy'}
                  className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-[1.2s] ease-premium group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-ink/40 to-transparent" />
                <div className="relative flex h-full flex-col justify-between p-7 sm:p-8">
                  <div className="flex items-start justify-between">
                    <span className="rounded-full border border-white/15 bg-ink/35 px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-white/55 backdrop-blur-md">
                      {String(index + 1).padStart(2, '0')} · {category.productCount ?? 0} pieces
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-ink/35 text-white/60 backdrop-blur-md transition group-hover:border-accent/40 group-hover:bg-accent/20 group-hover:text-accent-light">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <div>
                    <h2 className={index < 2 ? 'text-[34px] sm:text-[42px]' : 'text-[28px] sm:text-[32px]'} style={{ fontWeight: 500, letterSpacing: '-0.04em' }}>
                      {category.name}
                    </h2>
                    <p className="mt-2 max-w-[400px] text-[12px] leading-relaxed text-white/40">{category.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-accent-light">
                      Explore collection <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}

          <Reveal className="md:col-span-2">
            <Link
              to="/shop"
              className="group relative flex h-[220px] items-center justify-between overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(120deg,#131313_0%,#24211c_48%,#0d0d0f_100%)] px-8 transition hover:border-white/[0.16] sm:px-12"
            >
              <div className="absolute right-0 top-1/2 h-[320px] w-[320px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(199,161,122,0.25),transparent_65%)] blur-2xl" />
              <div className="relative">
                <p className="eyebrow mb-3">The full edit</p>
                <h2 className="max-w-[520px] text-[28px] leading-tight text-pearl sm:text-[36px]">
                  Everything, considered together.
                </h2>
                <p className="mt-2 max-w-[420px] text-[12px] text-white/35">
                  Browse the complete AURELIS catalogue — every piece, every finish.
                </p>
              </div>
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/70 transition group-hover:border-accent/50 group-hover:text-accent">
                <ArrowUpRight className="h-5 w-5" />
              </span>
            </Link>
          </Reveal>
        </div>
      )}

      <div className="mt-16 flex flex-col items-center gap-3 border-t border-white/[0.06] pt-10 text-center">
        <p className="eyebrow">Not sure where to begin?</p>
        <p className="max-w-md text-[12px] leading-relaxed text-white/35">
          Tell our concierge how you live and what you carry. We will suggest three pieces worth considering — no
          pressure, no algorithm.
        </p>
        <Link to="/contact" className={buttonStyles('outline', 'md', 'mt-2')}>Speak with the concierge</Link>
      </div>
    </div>
  );
};
