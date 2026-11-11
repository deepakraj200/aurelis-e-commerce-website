import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, LockKeyhole, RefreshCcw, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/services/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatMoney } from '@/utils/format';
import { cn } from '@/utils/cn';
import { PageIntro } from '@/components/ui/PageIntro';
import { EmptyState } from '@/components/ui/EmptyState';
import { buttonStyles } from '@/components/ui/Button';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { ProductImage } from '@/components/product/ProductImage';
import { Skeleton } from '@/components/ui/Skeleton';

export const CartPage = () => {
  useDocumentTitle('Shopping bag');
  const items = useCartStore((state) => state.items);
  const summary = useCartStore((state) => state.summary);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const remove = useCartStore((state) => state.remove);
  const initialized = useCartStore((state) => state.initialized);
  const user = useAuthStore((state) => state.user);
  const [busyId, setBusyId] = useState<string | null>(null);

  const freeShippingRemaining = Math.max(0, 150 - summary.subtotal);
  const shippingProgress = Math.min(100, (summary.subtotal / 150) * 100);

  const handleQuantity = async (id: string, quantity: number) => {
    setBusyId(id);
    try {
      await updateQuantity(id, quantity);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    setBusyId(id);
    try {
      await remove(id);
      toast.success(`${name} removed from your bag.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  if (!initialized) {
    return (
      <div className="container-premium py-14">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {[1, 2].map((entry) => <Skeleton key={entry} className="h-40 w-full rounded-3xl" />)}
          </div>
          <Skeleton className="h-80 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-premium pb-10 pt-10 sm:pt-14">
      <PageIntro
        eyebrow="Your selection"
        title="Shopping bag."
        description={
          items.length
            ? `${summary.count} piece${summary.count === 1 ? '' : 's'} held for you. Complimentary delivery over $150.`
            : 'A quiet place to collect the pieces you are considering.'
        }
        actions={
          <Link to="/shop" className={buttonStyles('ghost', 'md')}>
            Continue exploring <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={ShoppingBag}
            title="Your bag is empty"
            description="Every considered collection begins somewhere. Explore the signature pieces or revisit your wishlist."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/shop" className={buttonStyles('primary', 'md')}>Explore the shop</Link>
                <Link to="/wishlist" className={buttonStyles('outline', 'md')}>View wishlist</Link>
              </div>
            }
          />
        </div>
      ) : (
        <div className="mt-9 grid gap-10 lg:grid-cols-[1fr_370px] lg:gap-14">
          <div>
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
              <div className="flex-1">
                {freeShippingRemaining > 0 ? (
                  <p className="text-[11px] text-white/45">
                    Add <span className="text-pearl">{formatMoney(freeShippingRemaining, 'USD', false)}</span> for complimentary delivery.
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-[11px] text-emerald-300/80">
                    <Truck className="h-3.5 w-3.5" /> Complimentary delivery unlocked.
                  </p>
                )}
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${shippingProgress}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-accent-deep to-accent-light"
                  />
                </div>
              </div>
            </div>

            <div className="hidden grid-cols-[1fr_140px_120px_32px] gap-4 border-b border-white/[0.06] px-4 pb-3 text-[9px] uppercase tracking-[0.18em] text-white/25 sm:grid">
              <span>Piece</span>
              <span className="text-center">Quantity</span>
              <span className="text-right">Total</span>
              <span />
            </div>

            <div className="divide-y divide-white/[0.06]">
              {items.map((item) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'grid gap-4 py-5 sm:grid-cols-[1fr_140px_120px_32px] sm:items-center sm:px-4',
                    busyId === item._id && 'opacity-60'
                  )}
                >
                  <div className="flex gap-4">
                    <Link
                      to={`/product/${item.product.slug}`}
                      className="h-[118px] w-[98px] shrink-0 overflow-hidden rounded-2xl product-well"
                    >
                      <ProductImage src={item.product.images[0]} alt={item.product.name} />
                    </Link>
                    <div className="flex min-w-0 flex-col justify-center">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/25">
                        {typeof item.product.category === 'object' ? item.product.category.name : 'AURELIS'}
                      </p>
                      <Link
                        to={`/product/${item.product.slug}`}
                        className="mt-1.5 truncate text-[15px] font-medium text-pearl hover:text-white"
                      >
                        {item.product.name}
                      </Link>
                      <p className="mt-1 text-[10px] text-white/30">
                        {[item.color, item.size].filter(Boolean).join(' · ') || 'Standard finish'}
                      </p>
                      <p className="mt-2 text-[12px] text-white/55">{formatMoney(item.product.price, 'USD', false)}</p>
                      {item.quantity >= item.product.stock && item.product.stock > 0 && (
                        <p className="mt-1.5 text-[9px] text-amber-200/60">Only {item.product.stock} in stock</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-start sm:justify-center">
                    <QuantityStepper
                      value={item.quantity}
                      onChange={(quantity) => handleQuantity(item._id, quantity)}
                      max={Math.max(1, Math.min(item.product.stock, 20))}
                      disabled={busyId === item._id}
                    />
                  </div>

                  <div className="flex items-center justify-between sm:block sm:text-right">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-white/25 sm:hidden">Line total</span>
                    <span className="text-[14px] tabular-nums text-white/75">
                      {formatMoney(item.lineTotal)}
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemove(item._id, item.product.name)}
                      aria-label={`Remove ${item.product.name}`}
                      disabled={busyId === item._id}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-white/25 transition hover:bg-white/[0.05] hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-6">
              {[
                { icon: Truck, label: 'Complimentary delivery', copy: 'Over $150' },
                { icon: RefreshCcw, label: '30-day returns', copy: 'No questions asked' },
                { icon: ShieldCheck, label: 'Secure payments', copy: 'Encrypted checkout' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1.5 text-center">
                  <item.icon className="h-4 w-4 text-accent/60" strokeWidth={1.5} />
                  <p className="text-[10px] text-white/50">{item.label}</p>
                  <p className="text-[9px] text-white/20">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="glass overflow-hidden rounded-[26px]">
              <div className="border-b border-white/[0.07] px-6 py-5">
                <h2 className="text-[16px] font-medium text-pearl">Order summary</h2>
                <p className="mt-1 text-[10px] text-white/30">Taxes and delivery are estimated below.</p>
              </div>
              <div className="space-y-3 px-6 py-5 text-[12px]">
                <div className="flex justify-between text-white/45">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-white/80">{formatMoney(summary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-white/45">
                  <span>Delivery</span>
                  <span className={cn('tabular-nums', summary.shippingCost === 0 ? 'text-emerald-300/80' : 'text-white/80')}>
                    {summary.shippingCost === 0 ? 'Complimentary' : formatMoney(summary.shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-white/45">
                  <span>Estimated tax</span>
                  <span className="tabular-nums text-white/80">{formatMoney(summary.tax)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-white/[0.07] pt-4">
                  <span className="text-[13px] text-white/60">Total</span>
                  <span className="text-[24px] font-medium tracking-[-0.03em] tabular-nums text-pearl">
                    {formatMoney(summary.totalAmount)}
                  </span>
                </div>
              </div>
              <div className="px-6 pb-6">
                <Link
                  to="/checkout"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-pearl text-[12px] font-semibold text-ink transition hover:bg-white"
                >
                  {user ? 'Proceed to checkout' : 'Sign in to checkout'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {!user && (
                  <p className="mt-3 text-center text-[10px] text-white/30">
                    Your bag is saved. You will sign in on the next step.
                  </p>
                )}
                <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-[0.16em] text-white/20">
                  <LockKeyhole className="h-3 w-3" /> Encrypted & secure checkout
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <p className="text-[10px] text-white/30">Payment methods</p>
              <div className="flex gap-1.5">
                {['Visa', 'MC', 'Amex'].map((method) => (
                  <span key={method} className="rounded border border-white/10 px-1.5 py-0.5 text-[8px] text-white/35">
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
