import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ShoppingBag, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/services/api';
import { cn } from '@/utils/cn';
import { formatMoney } from '@/utils/format';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { ProductImage } from '@/components/product/ProductImage';

export const CartDrawer = () => {
  const open = useCartStore((state) => state.drawerOpen);
  const setOpen = useCartStore((state) => state.setDrawerOpen);
  const items = useCartStore((state) => state.items);
  const summary = useCartStore((state) => state.summary);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const remove = useCartStore((state) => state.remove);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  const handleQuantity = async (id: string, quantity: number) => {
    try {
      await updateQuantity(id, quantity);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await remove(id);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[85]">
          <motion.button
            type="button"
            aria-label="Close bag"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-sm"
          />
          <motion.aside
            aria-label="Shopping bag"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col border-l border-white/10"
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
              <div>
                <p className="eyebrow mb-1">Your selection</p>
                <h2 className="flex items-center gap-2 text-[19px] font-medium text-pearl">
                  Shopping bag
                  <span className="text-[12px] font-normal text-white/35">({summary.count})</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close bag"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                  <ShoppingBag className="h-6 w-6 text-white/35" strokeWidth={1.4} />
                </div>
                <h3 className="text-[17px] text-pearl">Your bag is quiet</h3>
                <p className="mt-2 max-w-[240px] text-[12px] leading-relaxed text-white/35">
                  Considered objects are waiting. Begin with the collection.
                </p>
                <Link
                  to="/shop"
                  onClick={() => setOpen(false)}
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-pearl px-6 py-3 text-[12px] font-semibold text-ink"
                >
                  Explore the collection <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item._id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                        className="flex gap-4 border-b border-white/[0.06] py-4"
                      >
                        <Link
                          to={`/product/${item.product.slug}`}
                          onClick={() => setOpen(false)}
                          className="h-[92px] w-[76px] shrink-0 overflow-hidden rounded-2xl product-well"
                        >
                          <ProductImage src={item.product.images[0]} alt={item.product.name} />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link
                                to={`/product/${item.product.slug}`}
                                onClick={() => setOpen(false)}
                                className="block truncate text-[13px] font-medium text-pearl hover:text-white"
                              >
                                {item.product.name}
                              </Link>
                              <p className="mt-1 text-[10px] text-white/35">
                                {[item.color, item.size].filter(Boolean).join(' · ') || 'Standard'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemove(item._id)}
                              aria-label={`Remove ${item.product.name}`}
                              className="text-white/25 transition hover:text-red-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <QuantityStepper
                              value={item.quantity}
                              onChange={(quantity) => handleQuantity(item._id, quantity)}
                              max={Math.max(1, Math.min(item.product.stock, 20))}
                              className="h-9"
                            />
                            <span className="text-[12px] tabular-nums text-white/70">
                              {formatMoney(item.product.price * item.quantity, 'USD', false)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="border-t border-white/[0.07] px-6 pb-6 pt-5">
                  <div className="space-y-2.5 text-[12px]">
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
                    {summary.shippingCost > 0 && (
                      <p className="text-[10px] text-white/25">
                        Add {formatMoney(150 - summary.subtotal, 'USD', false)} for complimentary delivery.
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4">
                    <span className="text-[12px] text-white/55">Estimated total</span>
                    <span className="text-[18px] font-medium tabular-nums text-pearl">{formatMoney(summary.totalAmount)}</span>
                  </div>
                  <div className="mt-5 flex flex-col gap-2">
                    <Link
                      to={user ? '/checkout' : '/login'}
                      state={!user ? { from: '/checkout' } : undefined}
                      onClick={() => setOpen(false)}
                      className="flex h-12 items-center justify-center gap-2 rounded-full bg-pearl text-[12px] font-semibold text-ink transition hover:bg-white"
                    >
                      {user ? 'Proceed to checkout' : 'Sign in to checkout'}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/cart"
                      onClick={() => setOpen(false)}
                      className="flex h-11 items-center justify-center rounded-full border border-white/10 text-[12px] text-white/55 transition hover:border-white/20 hover:text-white"
                    >
                      View full bag
                    </Link>
                  </div>
                  <p className="mt-4 text-center text-[9px] uppercase tracking-[0.18em] text-white/20">
                    Secure checkout · Taxes calculated at checkout
                  </p>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
