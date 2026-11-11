import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, PackageSearch, Search as SearchIcon, Sparkles } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/utils/cn';
import { SORT_OPTIONS } from '@/utils/constants';
import { SearchBar } from '@/components/layout/SearchBar';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Button, buttonStyles } from '@/components/ui/Button';

const suggestions = ['Titan', 'titanium', 'audio', 'camera', 'laptop', 'watch'];

export const SearchPage = () => {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'popular';
  const page = Math.max(1, Number(params.get('page') || 1));
  const categories = useCategories();
  useDocumentTitle(q ? `Search: ${q}` : 'Search');

  const activeCategory = categories.find((entry) => entry.slug === category);

  const { products, meta, loading, error, refetch } = useProducts(
    useMemo(
      () => ({
        q: q || undefined,
        category: category || undefined,
        sort: q ? sort : 'popular',
        page,
        limit: 12,
      }),
      [q, category, sort, page]
    )
  );

  const update = (key: string, value: string | undefined, resetPage = true) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  return (
    <div className="container-premium pb-10 pt-10 sm:pt-14">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow mb-4">Find your piece</p>
        <h1 className="text-[38px] leading-[1.02] tracking-[-0.045em] text-pearl sm:text-[54px]">
          Search the collection.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-[13px] leading-relaxed text-white/38">
          Look by product, collection, material or intention. Every result is a real object, ready to be considered.
        </p>
        <div className="mt-8">
          <SearchBar large initialQuery={q} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.18em] text-white/20">Try</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                update('q', suggestion);
              }}
              className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[10px] text-white/40 transition hover:border-white/20 hover:text-white"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-2 border-y border-white/[0.06] py-4">
        <button
          type="button"
          onClick={() => update('category', undefined)}
          className={cn(
            'rounded-full border px-4 py-2 text-[10px] transition',
            !category ? 'border-pearl bg-pearl text-ink' : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white'
          )}
        >
          All
        </button>
        {categories.map((entry) => (
          <button
            key={entry._id}
            type="button"
            onClick={() => update('category', entry.slug)}
            className={cn(
              'rounded-full border px-4 py-2 text-[10px] transition',
              category === entry.slug ? 'border-accent/40 bg-accent/10 text-accent-light' : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white'
            )}
          >
            {entry.name}
          </button>
        ))}
        <div className="relative ml-auto">
          <select
            value={sort}
            onChange={(event) => update('sort', event.target.value)}
            aria-label="Sort search results"
            className="h-9 appearance-none rounded-full border border-white/10 bg-white/[0.04] pl-4 pr-9 text-[10px] text-white/55"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-graphite">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-white/30" />
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">
              {q ? `${meta.total} result${meta.total === 1 ? '' : 's'}` : 'Popular now'}
            </p>
            <h2 className="mt-1.5 text-[24px] text-pearl sm:text-[28px]">
              {q ? (activeCategory ? `${activeCategory.name} · “${q}”` : `“${q}”`) : 'What the community is considering'}
            </h2>
          </div>
          {(q || category) && (
            <Link to="/search" className="text-[10px] uppercase tracking-[0.14em] text-white/25 transition hover:text-white">
              Clear search
            </Link>
          )}
        </div>

        {error ? (
          <EmptyState
            icon={PackageSearch}
            title="Search is taking a moment"
            description={error}
            action={<Button onClick={refetch}>Try again</Button>}
          />
        ) : loading ? (
          <ProductGridSkeleton count={6} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={SearchIcon}
            title={q ? `No pieces matched “${q}”` : 'No pieces found'}
            description="Try a collection name, a broader phrase, or explore the full catalogue. Sometimes the right object is one idea away."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/shop" className={buttonStyles('primary', 'md')}>Browse the shop</Link>
                <Link to="/categories" className={buttonStyles('outline', 'md')}>Explore collections</Link>
              </div>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product._id} product={product} priority={index < 4} />
              ))}
            </div>
            <Pagination
              page={meta.page}
              pages={meta.pages}
              onChange={(next) => {
                update('page', String(next), false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="mt-12"
            />
          </>
        )}
      </div>

      {!q && !loading && products.length > 0 && (
        <div className="mt-14 flex flex-col items-center gap-3 border-t border-white/[0.06] pt-10 text-center">
          <Sparkles className="h-4 w-4 text-accent/60" />
          <p className="text-[11px] text-white/30">
            Looking for something specific?{' '}
            <Link to="/contact" className="text-accent-light transition hover:text-accent">
              Ask our concierge
            </Link>
          </p>
        </div>
      )}
    </div>
  );
};
