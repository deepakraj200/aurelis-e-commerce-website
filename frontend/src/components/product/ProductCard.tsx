import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Eye, Heart, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useUiStore } from '@/store/uiStore';
import { getErrorMessage } from '@/services/api';
import { cn } from '@/utils/cn';
import { discountPercent } from '@/utils/format';
import { Badge } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { RatingStars } from '@/components/ui/RatingStars';
import { ProductImage } from './ProductImage';

export const ProductCard = ({ product, priority }: { product: Product; priority?: boolean }) => {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const add = useCartStore((state) => state.add);
  const initialized = useCartStore((state) => state.initialized);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const wishlisted = useWishlistStore((state) => state.items.some((item) => item._id === product._id));
  const wishlistPending = useWishlistStore((state) => state.pendingIds.includes(product._id));
  const openQuickView = useUiStore((state) => state.openQuickView);

  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const soldOut = product.stock <= 0;
  const categoryName = typeof product.category === 'object' ? product.category.name : 'Aurelis';
  const discount = discountPercent(product.price, product.originalPrice);

  const handleAdd = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (soldOut) return;
    setAdding(true);
    try {
      await add(product, {
        quantity: 1,
        color: product.colors[0]?.name || '',
        size: product.sizes[0] || '',
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await toggleWishlist(product);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <motion.article
      whileHover={reduced ? undefined : { y: -5 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col rounded-[26px] border border-white/[0.07] bg-gradient-to-b from-white/[0.055] to-white/[0.018] p-2.5 transition-colors duration-500 hover:border-white/[0.14] hover:shadow-[0_40px_90px_-50px_rgba(0,0,0,1)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] product-well">
        <Link to={`/product/${product.slug}`} aria-label={product.name} className="block h-full w-full">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            priority={priority}
            imgClassName="transition-transform duration-[900ms] ease-premium group-hover:scale-[1.045]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10" />
        </Link>

        <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
          {product.featured && <Badge tone="dark" className="border-white/10">Signature</Badge>}
          {discount > 0 && (
            <span className="rounded-full bg-ink/85 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-accent-light backdrop-blur-md">
              −{discount}%
            </span>
          )}
          {soldOut && (
            <span className="rounded-full bg-ink/85 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/70 backdrop-blur-md">
              Sold out
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.82 }}
            onClick={handleWishlist}
            disabled={wishlistPending}
            aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            aria-pressed={wishlisted}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-ink/40 text-white/75 backdrop-blur-xl transition hover:bg-ink/70 hover:text-white',
              wishlisted && 'border-accent/40 bg-accent/20 text-accent-light'
            )}
          >
            <motion.span
              key={wishlisted ? 'on' : 'off'}
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} />
            </motion.span>
          </motion.button>

          <button
            type="button"
            onClick={() => openQuickView(product)}
            aria-label={`Quick view ${product.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-ink/40 text-white/75 opacity-0 backdrop-blur-xl transition duration-300 hover:bg-ink/70 hover:text-white focus-visible:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>

        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-500 ease-premium group-hover:translate-y-0 group-hover:opacity-100 max-sm:hidden">
          <button
            type="button"
            onClick={() => {
              openQuickView(product);
            }}
            className="w-full rounded-full border border-white/30 bg-ink/60 py-2.5 text-[11px] font-medium text-white/85 backdrop-blur-xl transition hover:bg-ink/80"
          >
            Quick view
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-1.5 pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[9px] uppercase tracking-[0.2em] text-white/35">{categoryName}</p>
          <RatingStars rating={product.rating} size="xs" showValue={false} />
        </div>
        <Link to={`/product/${product.slug}`} className="mt-1.5 block">
          <h3 className="truncate text-[14px] font-medium tracking-[-0.015em] text-pearl">{product.name}</h3>
        </Link>
        <p className="mt-1 line-clamp-1 text-[11px] text-white/32">{product.shortDescription}</p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <Price price={product.price} originalPrice={product.originalPrice} size="md" showDiscount={false} />
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={soldOut ? () => navigate(`/product/${product.slug}`) : handleAdd}
            disabled={adding || (!initialized && !soldOut)}
            aria-label={soldOut ? 'View product' : `Add ${product.name} to bag`}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition duration-300',
              soldOut
                ? 'border-white/10 bg-white/[0.04] text-white/30'
                : justAdded
                  ? 'border-emerald-300/30 bg-emerald-400/15 text-emerald-300'
                  : 'border-white/15 bg-pearl text-ink hover:bg-white'
            )}
          >
            {adding ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-ink/20 border-t-ink" />
            ) : justAdded ? (
              <Check className="h-4 w-4" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
};
