import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { getErrorMessage } from '@/services/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageIntro } from '@/components/ui/PageIntro';
import { EmptyState } from '@/components/ui/EmptyState';
import { buttonStyles } from '@/components/ui/Button';
import { ProductImage } from '@/components/product/ProductImage';
import { RatingStars } from '@/components/ui/RatingStars';
import { Price } from '@/components/ui/Price';
import { Badge } from '@/components/ui/Badge';

export const WishlistPage = () => {
  useDocumentTitle('Wishlist');
  const items = useWishlistStore((state) => state.items);
  const remove = useWishlistStore((state) => state.remove);
  const addToCart = useCartStore((state) => state.add);
  const [busyId, setBusyId] = useState<string | null>(null);

  const moveToBag = async (product: (typeof items)[number]) => {
    setBusyId(product._id);
    try {
      await addToCart(product, {
        quantity: 1,
        color: product.colors[0]?.name || '',
        size: product.sizes[0] || '',
      });
      await remove(product._id, { quiet: true });
      toast.success(`${product.name} moved to your bag.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const removeItem = async (productId: string) => {
    try {
      await remove(productId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="container-premium pb-10 pt-10 sm:pt-14">
      <PageIntro
        eyebrow="Saved for later"
        title="Your wishlist."
        description={
          items.length
            ? `${items.length} piece${items.length === 1 ? '' : 's'} you are considering. Saved across your devices.`
            : 'A private place for the pieces that caught your attention.'
        }
        actions={
          <Link to="/shop" className={buttonStyles('ghost', 'md')}>
            Explore the collection <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            description="Tap the heart on any piece to keep it here. Your wishlist follows you across devices once you sign in."
            action={<Link to="/shop" className={buttonStyles('primary', 'md')}>Discover pieces</Link>}
          />
        </div>
      ) : (
        <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((product, index) => (
            <motion.article
              key={product._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.4 }}
              className="group flex gap-4 rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-3 transition hover:border-white/[0.13] sm:flex-col"
            >
              <Link
                to={`/product/${product.slug}`}
                className="relative h-[160px] w-[120px] shrink-0 overflow-hidden rounded-[18px] product-well sm:h-auto sm:w-full sm:aspect-[4/3]"
              >
                <ProductImage
                  src={product.images[0]}
                  alt={product.name}
                  imgClassName="transition-transform duration-700 group-hover:scale-[1.04]"
                />
                {product.stock <= 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-1 text-[8px] uppercase tracking-[0.14em] text-white/70 backdrop-blur-md">
                    Sold out
                  </span>
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-[0.16em] text-white/25">
                      {typeof product.category === 'object' ? product.category.name : 'AURELIS'}
                    </p>
                    <Link to={`/product/${product.slug}`} className="mt-1 block truncate text-[14px] font-medium text-pearl">
                      {product.name}
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(product._id)}
                    aria-label={`Remove ${product.name} from wishlist`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/25 transition hover:bg-white/[0.05] hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <RatingStars rating={product.rating} count={product.numReviews} size="xs" />
                </div>
                <Price price={product.price} originalPrice={product.originalPrice} size="sm" className="mt-2.5" />
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => moveToBag(product)}
                    disabled={product.stock <= 0 || busyId === product._id}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-pearl px-4 text-[11px] font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {product.stock <= 0 ? 'Unavailable' : busyId === product._id ? 'Adding…' : 'Move to bag'}
                    {product.stock > 0 && busyId !== product._id && <ShoppingBag className="h-3.5 w-3.5" />}
                  </button>
                  <Link
                    to={`/product/${product.slug}`}
                    className="inline-flex h-9 items-center justify-center rounded-full border border-white/10 px-3 text-[10px] text-white/50 transition hover:border-white/25 hover:text-white"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-[24px] border border-white/[0.06] bg-white/[0.02] px-6 py-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <Badge tone="accent">Considered advice</Badge>
            <p className="text-[11px] text-white/35">Unsure between two pieces? Our concierge can help.</p>
          </div>
          <Link to="/contact" className={buttonStyles('outline', 'sm')}>
            Ask a question <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Link to="/cart" className="inline-flex items-center gap-2 text-[11px] text-white/30 transition hover:text-white">
          <ShoppingBag className="h-3.5 w-3.5" /> View shopping bag <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};
