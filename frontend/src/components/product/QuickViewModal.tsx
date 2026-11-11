import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Heart, ShoppingBag, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUiStore } from '@/store/uiStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { getErrorMessage } from '@/services/api';
import { cn } from '@/utils/cn';
import { formatMoney } from '@/utils/format';
import { Modal } from '@/components/ui/Modal';
import { Price } from '@/components/ui/Price';
import { RatingStars } from '@/components/ui/RatingStars';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { ProductImage } from './ProductImage';

export const QuickViewModal = () => {
  const product = useUiStore((state) => state.quickView);
  const close = useUiStore((state) => state.closeQuickView);
  const add = useCartStore((state) => state.add);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const wishlisted = useWishlistStore((state) => (product ? state.items.some((item) => item._id === product._id) : false));

  const [imageIndex, setImageIndex] = useState(0);
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!product) return;
    setImageIndex(0);
    setColor(product.colors[0]?.name || '');
    setSize(product.sizes[0] || '');
    setQuantity(1);
    setAdded(false);
  }, [product]);

  if (!product) return null;

  const soldOut = product.stock <= 0;

  const handleAdd = async () => {
    setAdding(true);
    try {
      await add(product, { quantity, color, size });
      setAdded(true);
      setQuantity(1);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal open={Boolean(product)} onClose={close} size="xl" hideClose className="overflow-hidden p-0">
      <div className="grid max-h-[90vh] overflow-y-auto md:grid-cols-[1.05fr_1fr]">
        <div className="relative bg-[#0d0d0f] p-4 sm:p-6">
          <div className="relative aspect-square overflow-hidden rounded-[22px] product-well sm:aspect-[4/4.4]">
            <ProductImage
              src={product.images[imageIndex] || product.images[0]}
              alt={product.name}
              imgClassName="transition-transform duration-700 hover:scale-[1.03]"
            />
            <button
              type="button"
              onClick={close}
              aria-label="Close quick view"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink/50 text-white/70 backdrop-blur-xl transition hover:bg-ink/80 hover:text-white md:hidden"
            >
              ×
            </button>
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {product.images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setImageIndex(index)}
                  aria-label={`View image ${index + 1}`}
                  className={cn(
                    'h-14 w-14 shrink-0 overflow-hidden rounded-xl border transition',
                    imageIndex === index ? 'border-accent/60' : 'border-white/10 opacity-55 hover:opacity-90'
                  )}
                >
                  <ProductImage src={image} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex flex-col p-6 sm:p-8">
          <button
            type="button"
            onClick={close}
            aria-label="Close quick view"
            className="absolute right-5 top-5 hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:bg-white/10 hover:text-white md:flex"
          >
            ×
          </button>

          <p className="eyebrow mb-2.5">
            {typeof product.category === 'object' ? product.category.name : 'AURELIS'}
          </p>
          <h2 className="pr-10 text-[28px] leading-tight text-pearl">{product.name}</h2>
          <div className="mt-3 flex items-center gap-4">
            <RatingStars rating={product.rating} count={product.numReviews} />
            <span className="text-[11px] text-white/25">|</span>
            <span className={cn('text-[11px]', soldOut ? 'text-red-300' : 'text-emerald-300/80')}>
              {soldOut ? 'Out of stock' : `${product.stock} available`}
            </span>
          </div>

          <Price price={product.price} originalPrice={product.originalPrice} size="lg" className="mt-5" />
          <p className="mt-4 text-[13px] leading-relaxed text-white/45">{product.shortDescription}</p>

          {product.colors.length > 0 && (
            <div className="mt-6">
              <p className="field-label">Colour · <span className="text-white/70">{color}</span></p>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((entry) => (
                  <button
                    key={entry.name}
                    type="button"
                    onClick={() => setColor(entry.name)}
                    aria-label={entry.name}
                    title={entry.name}
                    className={cn(
                      'relative h-8 w-8 rounded-full border transition',
                      color === entry.name
                        ? 'border-accent ring-2 ring-accent/25 ring-offset-2 ring-offset-[#141416]'
                        : 'border-white/20 hover:border-white/45'
                    )}
                    style={{ backgroundColor: entry.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {product.sizes.length > 0 && (
            <div className="mt-5">
              <p className="field-label">Option</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => setSize(entry)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-[11px] transition',
                      size === entry
                        ? 'border-pearl bg-pearl text-ink'
                        : 'border-white/12 text-white/55 hover:border-white/30 hover:text-white'
                    )}
                  >
                    {entry}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <QuantityStepper value={quantity} onChange={setQuantity} max={Math.max(1, Math.min(product.stock, 20))} />
            <button
              type="button"
              onClick={handleAdd}
              disabled={soldOut || adding}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-pearl text-[12px] font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
              {soldOut ? 'Sold out' : added ? 'Added to bag' : adding ? 'Adding…' : `Add · ${formatMoney(product.price * quantity, 'USD', false)}`}
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product).catch((error) => toast.error(getErrorMessage(error)))}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition',
                wishlisted
                  ? 'border-accent/40 bg-accent/15 text-accent-light'
                  : 'border-white/12 text-white/55 hover:border-white/30 hover:text-white'
              )}
            >
              <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[11px] text-white/35">
            <Truck className="h-3.5 w-3.5" />
            Complimentary delivery over $150 · 30-day returns
          </div>

          <Link
            to={`/product/${product.slug}`}
            onClick={close}
            className="group mt-7 inline-flex items-center gap-2 text-[12px] text-white/55 transition hover:text-pearl"
          >
            View full details
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </Modal>
  );
};
