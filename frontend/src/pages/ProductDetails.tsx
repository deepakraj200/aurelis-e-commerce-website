import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Heart,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product, Review } from '@/types';
import { productService } from '@/services/productService';
import { orderService } from '@/services/orderService';
import { getErrorMessage } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useUiStore } from '@/store/uiStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/utils/cn';
import { formatDate, formatMoney, initials } from '@/utils/format';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductCard } from '@/components/product/ProductCard';
import { RatingStars } from '@/components/ui/RatingStars';
import { Price } from '@/components/ui/Price';
import { Badge } from '@/components/ui/Badge';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Button, buttonStyles } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';

const reviewableStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

const StarInput = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? '' : 's'}`}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="p-0.5"
        >
          <Star
            className={cn(
              'h-6 w-6 transition',
              (hover || value) >= star ? 'fill-accent text-accent' : 'fill-white/5 text-white/20'
            )}
          />
        </button>
      ))}
    </div>
  );
};

export const ProductDetailsPage = () => {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const add = useCartStore((state) => state.add);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const wishlistItems = useWishlistStore((state) => state.items);
  const pushActivity = useUiStore((state) => state.pushActivity);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewMeta, setReviewMeta] = useState({ page: 1, pages: 0, total: 0, average: 0 });
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [reviewLoading, setReviewLoading] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [purchaseCheckDone, setPurchaseCheckDone] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useDocumentTitle(product?.name || 'Product');

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.get(slug);
      setProduct(data.product);
      setColor(data.product.colors[0]?.name || '');
      setSize(data.product.sizes[0] || '');
      setQuantity(1);
      productService.related(data.product._id).then(setRelated).catch(() => setRelated([]));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const loadReviews = async (page = 1, append = false) => {
    if (!product) return;
    setReviewLoading(true);
    try {
      const result = await productService.reviews(product._id, page, 6);
      setReviews((current) => (append ? [...current, ...result.reviews] : result.reviews));
      setReviewMeta({
        page: result.meta?.page || 1,
        pages: result.meta?.pages || 0,
        total: result.meta?.total || 0,
        average: result.average,
      });
      setDistribution(result.distribution);
      setHasReviewed(
        result.reviews.some((review) => typeof review.user === 'object' && review.user._id === user?._id)
      );
    } catch {
      /* Reviews degrade gracefully. */
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    if (product) void loadReviews(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  useEffect(() => {
    if (!product || !user) {
      setPurchaseCheckDone(true);
      setCanReview(false);
      return;
    }
    setPurchaseCheckDone(false);
    orderService
      .list({ limit: 30 })
      .then((orders) => {
        const purchased = orders.data.some(
          (order) =>
            order.paymentStatus === 'paid' &&
            reviewableStatuses.includes(order.orderStatus) &&
            order.items.some((item) => item.product === product._id)
        );
        setCanReview(purchased);
      })
      .catch(() => setCanReview(false))
      .finally(() => setPurchaseCheckDone(true));
  }, [product?._id, user]);

  useEffect(() => {
    setFormOpen(false);
    setReviewTitle('');
    setReviewComment('');
    setRating(5);
  }, [slug]);

  const activeWishlisted = useMemo(
    () => (product ? wishlistItems.some((item) => item._id === product._id) : false),
    [product, wishlistItems]
  );

  const handleAdd = async (buyNow = false) => {
    if (!product) return;
    if (buyNow) setBuying(true);
    else setAdding(true);
    try {
      await add(product, { quantity, color, size });
      if (buyNow) {
        pushActivity({ title: 'Reserved in your bag', message: 'Continue to checkout to confirm your order.', href: '/checkout', actionLabel: 'Checkout', tone: 'accent' });
        navigate('/checkout');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
      setBuying(false);
    }
  };

  const handleWishlist = async () => {
    if (!product) return;
    try {
      await toggleWishlist(product);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!product) return;
    setSubmittingReview(true);
    try {
      await productService.createReview({
        productId: product._id,
        rating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });
      toast.success('Thank you for your review.');
      setFormOpen(false);
      setCanReview(false);
      setHasReviewed(true);
      await Promise.all([loadReviews(1), loadProduct()]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading && !product) {
    return (
      <div className="container-premium pt-10 sm:pt-14">
        <Skeleton className="h-4 w-52 rounded-full" />
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-[28px]" />
          <div className="space-y-4">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-12 w-3/4 rounded-xl" />
            <Skeleton className="h-4 w-40 rounded-full" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-premium py-24">
        <EmptyState
          icon={RefreshCcw}
          title="This piece could not be found"
          description={error || 'The product may have moved or sold out. Explore the current collection instead.'}
          action={
            <div className="flex gap-2">
              <Button onClick={() => void loadProduct()}>Try again</Button>
              <Link to="/shop" className={buttonStyles('outline', 'md')}>
                Back to shop
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const category = typeof product.category === 'object' ? product.category : null;
  const soldOut = product.stock <= 0;
  const distributionTotal = Object.values(distribution).reduce((sum, value) => sum + value, 0);

  return (
    <div className="container-premium pb-10 pt-8 sm:pt-10">
      <nav className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-white/25" aria-label="Breadcrumb">
        <Link to="/" className="transition hover:text-white">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/shop" className="transition hover:text-white">Shop</Link>
        {category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/shop?category=${category.slug}`} className="transition hover:text-white">
              {category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-white/45">{product.name}</span>
      </nav>

      <div className="mt-7 grid gap-10 md:grid-cols-[1.05fr_1fr] md:gap-12 lg:gap-16">
        <div>
          <ProductGallery
            images={product.images}
            name={product.name}
            badge={product.featured ? 'AURELIS Signature' : undefined}
          />
          <div className="mt-4 hidden grid-cols-3 gap-2 md:grid">
            {[
              { icon: Truck, title: 'Complimentary delivery', text: 'On orders over $150' },
              { icon: RefreshCcw, title: '30-day returns', text: 'Considered, no questions' },
              { icon: ShieldCheck, title: '2-year warranty', text: 'AURELIS Care included' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                <item.icon className="mb-2.5 h-4 w-4 text-accent/70" strokeWidth={1.5} />
                <p className="text-[10px] font-medium text-white/70">{item.title}</p>
                <p className="mt-0.5 text-[9px] text-white/25">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="md:sticky md:top-28 md:self-start">
          <div className="flex items-center gap-2.5">
            <span className="eyebrow">{category?.name || 'AURELIS'}</span>
            {product.featured && <span className="h-1 w-1 rounded-full bg-accent/60" />}
            {product.featured && <span className="text-[9px] uppercase tracking-[0.16em] text-white/30">Signature piece</span>}
          </div>

          <h1 className="mt-3 text-[36px] leading-[1.02] tracking-[-0.045em] text-pearl sm:text-[46px]">
            {product.name}
          </h1>

          <button
            type="button"
            onClick={() => {
              setFormOpen(false);
              document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mt-4 inline-flex items-center gap-3 text-left"
          >
            <RatingStars rating={reviewMeta.average || product.rating} count={reviewMeta.total || product.numReviews} />
            <span className="text-[10px] uppercase tracking-[0.12em] text-white/30 underline decoration-white/15 underline-offset-4">
              Read reviews
            </span>
          </button>

          <Price price={product.price} originalPrice={product.originalPrice} size="xl" className="mt-6" />

          <p className="mt-4 text-[13.5px] leading-relaxed text-white/45">{product.shortDescription}</p>

          <div className="mt-5 flex items-center gap-3 border-b border-white/[0.06] pb-5">
            <span
              className={cn(
                'flex items-center gap-1.5 text-[11px]',
                soldOut ? 'text-white/35' : product.stock <= 5 ? 'text-amber-200/80' : 'text-emerald-300/80'
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', soldOut ? 'bg-white/30' : product.stock <= 5 ? 'bg-amber-300' : 'bg-emerald-400')} />
              {soldOut ? 'Currently unavailable' : product.stock <= 5 ? `Only ${product.stock} remaining` : 'In stock · ready to dispatch'}
            </span>
            <span className="h-3 w-px bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.12em] text-white/25">SKU {product.sku || product._id.slice(-6)}</span>
          </div>

          {product.colors.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="field-label mb-0">Finish</p>
                <span className="text-[10px] text-white/35">{color}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {product.colors.map((entry) => (
                  <button
                    key={entry.name}
                    type="button"
                    onClick={() => setColor(entry.name)}
                    aria-label={entry.name}
                    aria-pressed={color === entry.name}
                    title={entry.name}
                    className={cn(
                      'relative h-9 w-9 rounded-full border transition',
                      color === entry.name
                        ? 'border-accent ring-2 ring-accent/25 ring-offset-2 ring-offset-[#08080a]'
                        : 'border-white/20 hover:border-white/50'
                    )}
                    style={{ backgroundColor: entry.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {product.sizes.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <p className="field-label mb-0">Option</p>
                <span className="text-[10px] text-white/35">{size}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => setSize(entry)}
                    aria-pressed={size === entry}
                    className={cn(
                      'rounded-full border px-4 py-2.5 text-[11px] transition',
                      size === entry
                        ? 'border-pearl bg-pearl text-ink'
                        : 'border-white/12 text-white/50 hover:border-white/30 hover:text-white'
                    )}
                  >
                    {entry}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              max={Math.max(1, Math.min(product.stock, 20))}
              disabled={soldOut}
            />
            <button
              type="button"
              onClick={handleWishlist}
              aria-label={activeWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full border transition',
                activeWishlisted
                  ? 'border-accent/40 bg-accent/15 text-accent-light'
                  : 'border-white/12 text-white/55 hover:border-white/30 hover:text-white'
              )}
            >
              <Heart className={cn('h-4 w-4', activeWishlisted && 'fill-current')} />
            </button>
            <span className="ml-auto text-[10px] text-white/25">{formatMoney(product.price * quantity, 'USD', false)}</span>
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            <Button
              size="lg"
              onClick={() => handleAdd(false)}
              loading={adding}
              disabled={soldOut}
              className="w-full"
            >
              {!adding && <ShoppingBag className="h-4 w-4" />}
              {soldOut ? 'Out of stock' : 'Add to bag'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleAdd(true)}
              loading={buying}
              disabled={soldOut}
              className="w-full"
            >
              {!buying && <ArrowRight className="h-4 w-4" />}
              Buy now
            </Button>
          </div>

          {soldOut && (
            <p className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-[11px] leading-relaxed text-white/35">
              This piece is currently unavailable. Explore the collection for something equally considered —
              <Link to="/shop" className="ml-1 text-accent-light hover:text-accent">browse the shop</Link>.
            </p>
          )}

          <div className="mt-6 space-y-2.5 border-t border-white/[0.06] pt-5 text-[11px] text-white/35">
            <p className="flex items-center gap-2.5"><Truck className="h-3.5 w-3.5 text-white/40" /> Complimentary delivery over $150 · dispatched in 1–2 business days</p>
            <p className="flex items-center gap-2.5"><PackageCheck className="h-3.5 w-3.5 text-white/40" /> 30-day returns and two-year AURELIS warranty</p>
            <p className="flex items-center gap-2.5"><Sparkles className="h-3.5 w-3.5 text-white/40" /> Packed in recycled, plastic-free materials</p>
          </div>
        </div>
      </div>

      <section className="mt-20 grid gap-12 border-t border-white/[0.06] pt-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div>
          <p className="eyebrow mb-4">In detail</p>
          <h2 className="text-[28px] leading-[1.1] text-pearl sm:text-[34px]">Considered from the inside out.</h2>
          <p className="mt-5 text-[13.5px] leading-[1.85] text-white/42">{product.description}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <Badge key={tag} tone="neutral">{tag}</Badge>
            ))}
          </div>
        </div>
        <div className="rounded-[26px] border border-white/[0.07] bg-white/[0.02]">
          <div className="border-b border-white/[0.06] px-6 py-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">Technical specification</p>
          </div>
          <dl className="divide-y divide-white/[0.05]">
            {product.specifications.map((spec) => (
              <div key={spec.label} className="grid grid-cols-[130px_1fr] gap-4 px-6 py-4 sm:grid-cols-[170px_1fr]">
                <dt className="text-[11px] text-white/30">{spec.label}</dt>
                <dd className="text-[12px] leading-relaxed text-white/65">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="reviews" className="mt-20 scroll-mt-28 border-t border-white/[0.06] pt-14">
        <div className="grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow mb-4">Owner reviews</p>
            <h2 className="text-[28px] leading-tight text-pearl sm:text-[34px]">Lived with, not just tried.</h2>
            <div className="mt-7 flex items-end gap-4">
              <span className="text-[56px] leading-none tracking-[-0.05em] text-pearl">
                {(reviewMeta.average || product.rating || 0).toFixed(1)}
              </span>
              <div className="pb-1.5">
                <RatingStars rating={reviewMeta.average || product.rating} showValue={false} size="md" />
                <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-white/30">
                  {reviewMeta.total || product.numReviews} verified review{(reviewMeta.total || product.numReviews) === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {distributionTotal > 0 && (
              <div className="mt-7 space-y-2.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[String(star)] || 0;
                  const percent = distributionTotal ? (count / distributionTotal) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="w-3 text-[10px] tabular-nums text-white/30">{star}</span>
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-accent/70" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-5 text-right text-[9px] tabular-nums text-white/25">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <p className="flex items-center gap-2 text-[11px] font-medium text-white/65">
                <ShieldCheck className="h-4 w-4 text-accent/70" /> Verified owners only
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-white/30">
                Reviews are published only after a confirmed purchase. It keeps this space useful.
              </p>
              {!user ? (
                <Link
                  to="/login"
                  state={{ from: `/product/${product.slug}` }}
                  className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-accent-light hover:text-accent"
                >
                  Sign in to review <ArrowUpRight className="h-3 w-3" />
                </Link>
              ) : purchaseCheckDone && canReview && !hasReviewed ? (
                <button
                  type="button"
                  onClick={() => setFormOpen((value) => !value)}
                  className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-accent-light hover:text-accent"
                >
                  {formOpen ? 'Close review form' : 'Write your review'} <ArrowUpRight className="h-3 w-3" />
                </button>
              ) : hasReviewed ? (
                <p className="mt-4 flex items-center gap-1.5 text-[11px] text-emerald-300/70">
                  <Check className="h-3 w-3" /> You have reviewed this piece
                </p>
              ) : (
                <p className="mt-4 text-[11px] text-white/25">A confirmed purchase is required to review.</p>
              )}
            </div>
          </div>

          <div>
            <AnimatePresence initial={false}>
              {formOpen && canReview && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  onSubmit={handleReview}
                  className="mb-8 overflow-hidden rounded-[24px] border border-accent/20 bg-accent/[0.04] p-6"
                >
                  <h3 className="text-[18px] text-pearl">Share your experience</h3>
                  <p className="mt-1 text-[11px] text-white/35">Your review will carry a verified purchase badge.</p>
                  <div className="mt-5">
                    <p className="field-label">Rating</p>
                    <StarInput value={rating} onChange={setRating} />
                  </div>
                  <div className="mt-5">
                    <label htmlFor="review-title" className="field-label">Title</label>
                    <input
                      id="review-title"
                      value={reviewTitle}
                      onChange={(event) => setReviewTitle(event.target.value)}
                      maxLength={90}
                      placeholder="A few words that capture it"
                      className="field"
                    />
                  </div>
                  <div className="mt-4">
                    <label htmlFor="review-comment" className="field-label">Your review</label>
                    <textarea
                      id="review-comment"
                      required
                      minLength={4}
                      maxLength={1200}
                      rows={4}
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      placeholder="What stood out? How does it feel after daily use?"
                      className="field resize-none"
                    />
                  </div>
                  <div className="mt-5 flex gap-2">
                    <Button type="submit" loading={submittingReview}>Publish review</Button>
                    <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {reviewLoading && reviews.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((entry) => <Skeleton key={entry} className="h-36 w-full rounded-2xl" />)}
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.02] p-10 text-center">
                <Star className="mx-auto mb-4 h-6 w-6 text-white/20" />
                <p className="text-[15px] text-white/60">No reviews yet</p>
                <p className="mt-2 text-[11px] text-white/30">Be the first considered voice. Verified owners can publish a review.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review, index) => {
                  const reviewer = typeof review.user === 'object' ? review.user : null;
                  return (
                    <motion.article
                      key={review._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.4 }}
                      className="rounded-[22px] border border-white/[0.07] bg-white/[0.022] p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-white/15 to-white/[0.04] text-[10px] font-semibold text-white/70">
                            {initials(reviewer?.name)}
                          </span>
                          <div>
                            <p className="text-[12px] text-white/70">{reviewer?.name || 'AURELIS owner'}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge tone="success" className="px-1.5 py-0.5 text-[8px]">Verified</Badge>
                              <span className="text-[9px] text-white/25">{formatDate(review.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <RatingStars rating={review.rating} showValue={false} size="sm" />
                      </div>
                      {review.title && <h3 className="mt-4 text-[13px] font-medium text-white/80">{review.title}</h3>}
                      <p className="mt-2 text-[12.5px] leading-[1.75] text-white/40">{review.comment}</p>
                    </motion.article>
                  );
                })}
                {reviewMeta.pages > reviewMeta.page && (
                  <div className="pt-2 text-center">
                    <Button
                      variant="outline"
                      loading={reviewLoading}
                      onClick={() => {
                        void loadReviews(reviewMeta.page + 1, true);
                      }}
                    >
                      Load more reviews
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-20 border-t border-white/[0.06] pt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Together with</p>
            <h2 className="text-[28px] text-pearl sm:text-[34px]">Complete the set.</h2>
          </div>
          <Link to="/shop" className={buttonStyles('ghost', 'md', 'hidden sm:inline-flex')}>
            All products <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {related.length === 0 ? (
          <div className="mt-8"><ProductGridSkeleton count={4} /></div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.slice(0, 4).map((item) => <ProductCard key={item._id} product={item} />)}
          </div>
        )}
      </section>

      <div className="mt-14 flex items-center justify-between border-t border-white/[0.06] pt-6">
        <Link to="/shop" className="inline-flex items-center gap-2 text-[11px] text-white/35 transition hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Continue exploring
        </Link>
        <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">AURELIS · {category?.name}</span>
      </div>
    </div>
  );
};
