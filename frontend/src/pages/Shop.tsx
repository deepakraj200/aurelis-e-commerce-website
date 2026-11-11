import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Filter,
  PackageSearch,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Category } from '@/types';
import { productService } from '@/services/productService';
import { useProducts } from '@/hooks/useProducts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/utils/cn';
import { formatMoney } from '@/utils/format';
import { SORT_OPTIONS } from '@/utils/constants';
import { PageIntro } from '@/components/ui/PageIntro';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';

const pricePresets = [
  { label: 'Under $200', min: '', max: '200' },
  { label: '$200 – $600', min: '200', max: '600' },
  { label: '$600 – $1,500', min: '600', max: '1500' },
  { label: '$1,500+', min: '1500', max: '' },
];

export const ShopPage = () => {
  useDocumentTitle('Shop the collection');
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(params.get('q') || '');
  const [minPrice, setMinPrice] = useState(params.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') || '');

  const categoryParam = params.get('category') || '';
  const q = params.get('q') || '';
  const rating = params.get('rating') || '';
  const sort = params.get('sort') || 'newest';
  const page = Math.max(1, Number(params.get('page') || 1));
  const inStock = params.get('inStock') === 'true';
  const onSale = params.get('onSale') === 'true';

  const productParams = useMemo(
    () => ({
      category: categoryParam || undefined,
      q: q || undefined,
      minPrice: params.get('minPrice') || undefined,
      maxPrice: params.get('maxPrice') || undefined,
      rating: rating || undefined,
      inStock: inStock || undefined,
      onSale: onSale || undefined,
      sort,
      page,
      limit: 12,
    }),
    [categoryParam, q, params, rating, inStock, onSale, sort, page]
  );

  const { products, meta, loading, error, refetch } = useProducts(productParams);

  useEffect(() => {
    productService.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setSearchTerm(q);
    setMinPrice(params.get('minPrice') || '');
    setMaxPrice(params.get('maxPrice') || '');
  }, [q, params]);

  const update = (updates: Record<string, string | undefined>, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, value);
    });
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    update({ q: searchTerm.trim() || undefined });
  };

  const applyPrice = () => {
    const min = minPrice ? Number(minPrice) : undefined;
    const max = maxPrice ? Number(maxPrice) : undefined;
    if (min !== undefined && max !== undefined && min > max) {
      toast.error('Minimum price cannot exceed maximum price.');
      return;
    }
    update({
      minPrice: min !== undefined ? String(min) : undefined,
      maxPrice: max !== undefined ? String(max) : undefined,
    });
    setFiltersOpen(false);
  };

  const choosePreset = (preset: (typeof pricePresets)[number]) => {
    setMinPrice(preset.min);
    setMaxPrice(preset.max);
    update({ minPrice: preset.min || undefined, maxPrice: preset.max || undefined });
  };

  const clearAll = () => {
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setParams(new URLSearchParams(), { replace: true });
  };

  const activeCategory = categories.find((category) => category.slug === categoryParam);
  const hasFilters = Boolean(q || categoryParam || rating || inStock || onSale || params.get('minPrice') || params.get('maxPrice'));

  const activeChips = [
    ...(q ? [{ key: 'q', label: `“${q}”` }] : []),
    ...(activeCategory ? [{ key: 'category', label: activeCategory.name }] : []),
    ...(params.get('minPrice') || params.get('maxPrice')
      ? [
          {
            key: 'price',
            label: `${params.get('minPrice') ? formatMoney(Number(params.get('minPrice')), 'USD', false) : 'Any'} – ${
              params.get('maxPrice') ? formatMoney(Number(params.get('maxPrice')), 'USD', false) : 'Any'
            }`,
          },
        ]
      : []),
    ...(rating ? [{ key: 'rating', label: `${rating}★ & up` }] : []),
    ...(inStock ? [{ key: 'inStock', label: 'In stock' }] : []),
    ...(onSale ? [{ key: 'onSale', label: 'On sale' }] : []),
  ];

  const removeChip = (key: string) => {
    if (key === 'price') update({ minPrice: undefined, maxPrice: undefined });
    else update({ [key]: undefined });
  };

  const priceOptions = [4, 3];
  const filterContent = (
    <div className="space-y-8">
      <form onSubmit={submitSearch}>
        <p className="field-label">Search</p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search this collection"
            className="field h-11 pl-10 pr-9"
            aria-label="Search products"
          />
          {searchTerm && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearchTerm('');
                update({ q: undefined });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </form>

      <div>
        <p className="field-label">Collection</p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => update({ category: undefined })}
            className={cn(
              'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[12px] transition',
              !categoryParam ? 'bg-white/[0.07] text-pearl' : 'text-white/45 hover:bg-white/[0.04] hover:text-white'
            )}
          >
            All pieces <span className="text-[10px] tabular-nums text-white/25">{meta.total}</span>
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              type="button"
              onClick={() => update({ category: category.slug })}
              className={cn(
                'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[12px] transition',
                categoryParam === category.slug
                  ? 'bg-white/[0.07] text-pearl'
                  : 'text-white/45 hover:bg-white/[0.04] hover:text-white'
              )}
            >
              {category.name}
              <span className="text-[10px] tabular-nums text-white/25">{category.productCount ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="field-label">Price</p>
        <div className="grid grid-cols-2 gap-2">
          {pricePresets.map((preset) => {
            const selected = params.get('minPrice') === preset.min && params.get('maxPrice') === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => choosePreset(preset)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left text-[11px] transition',
                  selected
                    ? 'border-accent/40 bg-accent/10 text-accent-light'
                    : 'border-white/[0.08] text-white/45 hover:border-white/20 hover:text-white'
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            inputMode="numeric"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value.replace(/[^\d]/g, ''))}
            placeholder="Min"
            aria-label="Minimum price"
            className="field h-10 px-3 text-[11px]"
          />
          <span className="text-white/20">—</span>
          <input
            inputMode="numeric"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value.replace(/[^\d]/g, ''))}
            placeholder="Max"
            aria-label="Maximum price"
            className="field h-10 px-3 text-[11px]"
          />
          <button
            type="button"
            onClick={applyPrice}
            className="flex h-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] px-4 text-[11px] text-white/70 transition hover:bg-white/[0.12] hover:text-white"
          >
            Go
          </button>
        </div>
      </div>

      <div>
        <p className="field-label">Rating</p>
        <div className="flex flex-wrap gap-2">
          {priceOptions.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => update({ rating: rating === String(value) ? undefined : String(value) })}
              className={cn(
                'rounded-full border px-3.5 py-2 text-[11px] transition',
                rating === String(value)
                  ? 'border-accent/40 bg-accent/10 text-accent-light'
                  : 'border-white/[0.08] text-white/45 hover:border-white/20 hover:text-white'
              )}
            >
              {value}★ & up
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 border-t border-white/[0.06] pt-6">
        {[
          { key: 'inStock', label: 'In stock only', value: inStock },
          { key: 'onSale', label: 'On sale', value: onSale },
        ].map((toggle) => (
          <button
            key={toggle.key}
            type="button"
            onClick={() => update({ [toggle.key]: toggle.value ? undefined : 'true' })}
            className="flex w-full items-center justify-between text-[12px] text-white/50 transition hover:text-white"
            role="switch"
            aria-checked={toggle.value}
          >
            {toggle.label}
            <span
              className={cn(
                'relative h-5 w-9 rounded-full border transition',
                toggle.value ? 'border-accent/40 bg-accent/80' : 'border-white/15 bg-white/[0.05]'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all',
                  toggle.value ? 'left-[18px]' : 'left-0.5'
                )}
              />
            </span>
          </button>
        ))}
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-2 text-[11px] text-white/35 transition hover:text-white"
        >
          <X className="h-3 w-3" /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="container-premium pb-10 pt-10 sm:pt-14">
      <PageIntro
        eyebrow="The collection"
        title={q ? `Results for “${q}”` : categoryParam && activeCategory ? activeCategory.name : 'Every object, considered.'}
        description={
          q
            ? `${meta.total} piece${meta.total === 1 ? '' : 's'} found. Refine the collection or begin again.`
            : categoryParam && activeCategory
              ? activeCategory.description
              : 'A tightly edited catalogue of phones, audio, wearables, computing, imaging and the details between. Nothing superfluous.'
        }
        actions={
          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] uppercase tracking-[0.18em] text-white/25 sm:block">
              {meta.total} pieces
            </span>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-[12px] text-white/60 transition hover:border-white/20 hover:text-white lg:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            </button>
          </div>
        }
      />

      <div className="mt-8 flex items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => removeChip(chip.key)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] text-white/60 transition hover:border-white/20 hover:text-white"
            >
              {chip.label} <X className="h-2.5 w-2.5" />
            </button>
          ))}
          {!activeChips.length && (
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/25">
              <Filter className="h-3 w-3" /> All collections
            </span>
          )}
        </div>
        <div className="relative shrink-0">
          <select
            value={sort}
            onChange={(event) => update({ sort: event.target.value === 'newest' ? undefined : event.target.value })}
            aria-label="Sort products"
            className="h-10 appearance-none rounded-full border border-white/10 bg-white/[0.04] pl-4 pr-9 text-[11px] text-white/60 transition hover:border-white/20 focus:border-accent/40"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-graphite text-pearl">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[230px_1fr] lg:gap-12">
        <aside className="hidden lg:block">
          <div className="sticky top-28">{filterContent}</div>
        </aside>

        <div>
          {error ? (
            <EmptyState
              icon={RefreshCcw}
              title="The collection could not load"
              description={error}
              action={<Button onClick={refetch}>Try again</Button>}
            />
          ) : loading ? (
            <ProductGridSkeleton count={6} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Nothing matched this search"
              description="Try a broader price range or explore the full collection. The right object may be one filter away."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={clearAll}>Clear filters</Button>
                  <Button variant="outline" onClick={() => setFiltersOpen(true)}>
                    Refine
                  </Button>
                </div>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                {products.map((product, index) => (
                  <ProductCard key={product._id} product={product} priority={index < 3} />
                ))}
              </div>
              <Pagination
                page={meta.page}
                pages={meta.pages}
                onChange={(next) => {
                  update({ page: String(next) }, false);
                  document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-12"
              />
              <p className="mt-4 text-center text-[10px] text-white/20">
                Showing {products.length} of {meta.total} pieces
              </p>
            </>
          )}
        </div>
      </div>

      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Refine" size="sm">
        {filterContent}
        <div className="sticky bottom-0 -mx-6 mt-8 border-t border-white/[0.07] bg-graphite/95 px-6 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8">
          <button
            type="button"
            onClick={() => setFiltersOpen(false)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-pearl text-[12px] font-semibold text-ink"
          >
            View {meta.total} pieces
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </Modal>

      {hasFilters && (
        <div className="mt-10 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/20">
          <Check className="h-3 w-3 text-accent/60" /> Filtered with precision
        </div>
      )}
    </div>
  );
};
