import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  HelpCircle,
  MapPin,
  PackageCheck,
  RefreshCcw,
  Sparkles,
  Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order } from '@/types';
import { orderService } from '@/services/orderService';
import { getErrorMessage } from '@/services/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate, formatDateTime, formatMoney } from '@/utils/format';
import { ORDER_STAGES } from '@/utils/constants';
import { cn } from '@/utils/cn';
import { buttonStyles } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProductImage } from '@/components/product/ProductImage';
import { Badge } from '@/components/ui/Badge';

export const OrderTrackingPage = () => {
  const { id = '' } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useDocumentTitle(order ? `Order ${order.orderNumber}` : 'Order tracking');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.get(id);
      setOrder(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const confirmCancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      const updated = await orderService.cancel(order._id, reason.trim() || undefined);
      setOrder(updated);
      setCancelOpen(false);
      setReason('');
      toast.success('Order cancelled and refunded where applicable.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="container-premium pt-10 sm:pt-14">
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="mt-6 h-14 w-80 rounded-2xl" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-[24px]" />
            <Skeleton className="h-64 w-full rounded-[24px]" />
          </div>
          <Skeleton className="h-80 w-full rounded-[24px]" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-premium py-24">
        <EmptyState
          icon={RefreshCcw}
          title="This order could not be found"
          description={error || 'It may belong to another account, or the link may be incomplete.'}
          action={<Link to="/orders" className={buttonStyles('primary', 'md')}>Back to my orders</Link>}
        />
      </div>
    );
  }

  const isCancelled = order.orderStatus === 'cancelled';
  const currentStage = ORDER_STAGES.findIndex((stage) => stage.status === order.orderStatus);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="container-premium pb-10 pt-8 sm:pt-10">
      <Link to="/orders" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/30 transition hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" /> All orders
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-5 border-b border-white/[0.06] pb-8">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[30px] leading-none tracking-[-0.04em] text-pearl sm:text-[38px]">{order.orderNumber}</h1>
            <StatusBadge status={order.orderStatus} />
            {order.paymentStatus === 'refunded' && <Badge tone="neutral">Refunded</Badge>}
          </div>
          <p className="mt-2.5 text-[11px] text-white/30">
            Placed {formatDate(order.createdAt, { month: 'long', day: 'numeric', year: 'numeric' })} · {itemCount} pieces ·{' '}
            {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Paid by card'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.16em] text-white/25">Order total</p>
            <p className="text-[24px] tabular-nums text-pearl">{formatMoney(order.totalAmount)}</p>
          </div>
        </div>
      </div>

      {isCancelled && (
        <div className="mt-6 rounded-[22px] border border-red-400/15 bg-red-500/[0.055] px-5 py-4">
          <p className="text-[12px] text-red-200">This order was cancelled.</p>
          <p className="mt-1 text-[10px] text-white/30">
            {order.cancelReason || 'No reason was provided.'} · {order.cancelledAt ? formatDateTime(order.cancelledAt) : ''}
          </p>
        </div>
      )}

      {order.orderStatus === 'pending_payment' && (
        <div className="mt-6 rounded-[22px] border border-amber-400/15 bg-amber-400/[0.05] px-5 py-4">
          <p className="text-[12px] text-amber-100/85">Payment is still awaiting confirmation.</p>
          <p className="mt-1 text-[10px] leading-relaxed text-white/30">
            Your pieces are reserved for a limited time. If payment was not completed, you can cancel below to release them.
          </p>
        </div>
      )}

      {!isCancelled && (
        <div className="mt-6 overflow-hidden rounded-[26px] border border-white/[0.07] bg-white/[0.022]">
          <div className="border-b border-white/[0.06] px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow mb-2">Live tracking</p>
                <h2 className="text-[20px] text-pearl">{order.statusLabel || order.orderStatus.replaceAll('_', ' ')}</h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/30">
                <Clock3 className="h-3.5 w-3.5" /> Updated {formatDateTime(order.updatedAt)}
              </div>
            </div>
          </div>
          <div className="px-4 py-7 sm:px-6">
            <div className="hidden sm:block">
              <div className="relative flex items-start justify-between">
                <div className="absolute left-[4%] right-[4%] top-[13px] h-px bg-white/[0.08]" />
                <div
                  className="absolute left-[4%] top-[13px] h-px bg-gradient-to-r from-accent-deep to-accent-light transition-all duration-700"
                  style={{ width: `${Math.max(0, currentStage) * 18.4}%` }}
                />
                {ORDER_STAGES.map((stage, index) => {
                  const done = index <= currentStage;
                  const active = index === currentStage;
                  return (
                    <div key={stage.status} className="relative z-10 flex w-full flex-col items-center text-center">
                      <span
                        className={cn(
                          'flex h-[27px] w-[27px] items-center justify-center rounded-full border transition duration-500',
                          done
                            ? 'border-accent/50 bg-[#1a1712] text-accent'
                            : 'border-white/10 bg-[#0c0c0e] text-white/20',
                          active && 'shadow-[0_0_0_5px_rgba(199,161,122,0.1)]'
                        )}
                      >
                        {index < currentStage ? <Check className="h-3 w-3" /> : <span className="h-1 w-1 rounded-full bg-current" />}
                      </span>
                      <p className={cn('mt-3 text-[10px]', done ? 'text-white/70' : 'text-white/25')}>{stage.label}</p>
                      <p className="mt-1 hidden max-w-[110px] text-[9px] leading-relaxed text-white/20 lg:block">
                        {stage.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-0 sm:hidden">
              {ORDER_STAGES.map((stage, index) => {
                const done = index <= currentStage;
                return (
                  <div key={stage.status} className="flex gap-3.5">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                          done ? 'border-accent/50 bg-accent/10 text-accent' : 'border-white/10 text-white/20'
                        )}
                      >
                        {index < currentStage ? <Check className="h-3 w-3" /> : <span className="h-1 w-1 rounded-full bg-current" />}
                      </span>
                      {index < ORDER_STAGES.length - 1 && (
                        <span className={cn('my-1 h-7 w-px', done ? 'bg-accent/30' : 'bg-white/[0.07]')} />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className={cn('text-[11px]', done ? 'text-white/70' : 'text-white/25')}>{stage.label}</p>
                      <p className="mt-0.5 text-[9px] text-white/20">{stage.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
        <div className="space-y-6">
          <section className="rounded-[24px] border border-white/[0.07] bg-white/[0.022]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
              <h2 className="text-[15px] text-pearl">In this order</h2>
              <span className="text-[10px] text-white/25">{itemCount} pieces</span>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {order.items.map((item, index) => {
                const reviewed = order.reviewedProductIds?.includes(item.product);
                return (
                  <div key={`${item.product}-${index}`} className="flex gap-4 px-5 py-4 sm:px-6">
                    <Link to={`/product/${item.slug || item.product}`} className="h-[84px] w-[70px] shrink-0 overflow-hidden rounded-xl product-well">
                      <ProductImage src={item.image} alt={item.name} />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <Link to={`/product/${item.slug || item.product}`} className="truncate text-[13px] font-medium text-white/75 hover:text-white">
                        {item.name}
                      </Link>
                      <p className="mt-1 text-[10px] text-white/30">
                        {[item.color, item.size].filter(Boolean).join(' · ') || 'Standard'} · Qty {item.quantity}
                      </p>
                      {order.orderStatus === 'delivered' && (
                        reviewed ? (
                          <span className="mt-2 inline-flex items-center gap-1 text-[9px] text-emerald-300/60">
                            <Check className="h-2.5 w-2.5" /> Reviewed
                          </span>
                        ) : (
                          <Link
                            to={`/product/${item.slug || item.product}`}
                            className="mt-2 inline-flex items-center gap-1 text-[9px] text-accent-light/80 transition hover:text-accent"
                          >
                            <Sparkles className="h-2.5 w-2.5" /> Write a review
                          </Link>
                        )
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] tabular-nums text-white/65">{formatMoney(item.price * item.quantity)}</p>
                      <p className="mt-1 text-[9px] text-white/25">{formatMoney(item.price, 'USD', false)} each</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[24px] border border-white/[0.07] bg-white/[0.022]">
            <div className="border-b border-white/[0.06] px-6 py-4">
              <h2 className="text-[15px] text-pearl">Tracking history</h2>
            </div>
            <div className="px-6 py-6">
              {order.trackingHistory.length === 0 ? (
                <p className="text-[11px] text-white/30">Tracking updates will appear here.</p>
              ) : (
                <div className="relative space-y-6">
                  <span className="absolute bottom-2 left-[5px] top-2 w-px bg-white/[0.08]" />
                  {[...order.trackingHistory].reverse().map((event, index) => (
                    <div key={`${event.status}-${event.at}-${index}`} className="relative flex gap-4">
                      <span
                        className={cn(
                          'relative z-10 mt-1 flex h-[11px] w-[11px] shrink-0 items-center justify-center rounded-full border-2',
                          index === 0 ? 'border-accent bg-[#15120e]' : 'border-white/15 bg-[#0c0c0e]'
                        )}
                      >
                        {index === 0 && <span className="h-1 w-1 rounded-full bg-accent" />}
                      </span>
                      <div className="-mt-0.5">
                        <p className={cn('text-[12px]', index === 0 ? 'text-white/75' : 'text-white/45')}>{event.label}</p>
                        {event.note && <p className="mt-1 text-[10px] leading-relaxed text-white/25">{event.note}</p>}
                        <p className="mt-1.5 text-[9px] uppercase tracking-[0.12em] text-white/20">{formatDateTime(event.at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-6">
            <h2 className="text-[13px] font-medium text-white/75">Delivery address</h2>
            <div className="mt-3 flex gap-2.5 text-[11px] leading-relaxed text-white/35">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
              <div>
                <p className="text-white/65">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
                <p className="mt-1.5 text-white/25">{order.shippingAddress.phone}</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4 text-[10px] text-white/30">
              <Truck className="h-3.5 w-3.5 text-accent/60" />
              {order.orderStatus === 'delivered'
                ? `Delivered ${order.deliveredAt ? formatDate(order.deliveredAt) : ''}`
                : 'Complimentary delivery · 1–2 business days'}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-6">
            <h2 className="text-[13px] font-medium text-white/75">Payment summary</h2>
            <div className="mt-4 space-y-2.5 text-[11px]">
              <div className="flex justify-between text-white/35"><span>Subtotal</span><span className="tabular-nums text-white/60">{formatMoney(order.subtotal)}</span></div>
              <div className="flex justify-between text-white/35"><span>Delivery</span><span className="tabular-nums text-white/60">{order.shippingCost === 0 ? 'Complimentary' : formatMoney(order.shippingCost)}</span></div>
              <div className="flex justify-between text-white/35"><span>Tax</span><span className="tabular-nums text-white/60">{formatMoney(order.tax)}</span></div>
              <div className="flex justify-between border-t border-white/[0.07] pt-3 text-[12px]">
                <span className="text-white/55">Total</span>
                <span className="tabular-nums text-pearl">{formatMoney(order.totalAmount)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4 text-[10px]">
              <span className="text-white/30">Payment</span>
              <StatusBadge status={order.paymentStatus} />
            </div>
          </div>

          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-6">
            <h2 className="text-[13px] font-medium text-white/75">Need something?</h2>
            <p className="mt-2 text-[10px] leading-relaxed text-white/30">
              Our concierge can help with delivery changes, returns or product care.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link to="/contact" className={buttonStyles('secondary', 'sm')}>
                <HelpCircle className="h-3.5 w-3.5" /> Contact concierge
              </Link>
              {order.canCancel && (
                <button
                  type="button"
                  onClick={() => setCancelOpen(true)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/[0.08] text-[10px] text-white/35 transition hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-200"
                >
                  Cancel this order
                </button>
              )}
            </div>
          </div>

          <Link to="/shop" className="flex items-center justify-center gap-2 rounded-full border border-white/[0.07] px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-white/30 transition hover:border-white/15 hover:text-white">
            Continue exploring <ArrowRight className="h-3 w-3" />
          </Link>
        </aside>
      </div>

      {order.orderStatus === 'delivered' && (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-[24px] border border-white/[0.06] bg-white/[0.02] px-6 py-8 text-center">
          <PackageCheck className="h-5 w-5 text-accent/60" />
          <p className="text-[13px] text-white/55">Aurelis care does not end at delivery.</p>
          <p className="max-w-md text-[10px] leading-relaxed text-white/25">
            Every piece includes a two-year warranty. If anything is not as it should be, we will make it right.
          </p>
          <Link to="/about#warranty" className="text-[10px] text-accent-light transition hover:text-accent">
            Read about AURELIS Care
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => {
          setCancelOpen(false);
          setReason('');
        }}
        onConfirm={confirmCancel}
        loading={cancelling}
        title="Cancel this order?"
        description="Your payment will be refunded to the original method and reserved stock released. This cannot be undone."
        confirmLabel="Cancel order"
        danger
      >
        <label htmlFor="track-cancel-reason" className="field-label">Reason (optional)</label>
        <textarea
          id="track-cancel-reason"
          rows={3}
          maxLength={240}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="field resize-none"
          placeholder="Let us know why."
        />
      </ConfirmDialog>
    </div>
  );
};
