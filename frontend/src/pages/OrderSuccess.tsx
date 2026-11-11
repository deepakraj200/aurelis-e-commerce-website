import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Clipboard,
  CreditCard,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order } from '@/types';
import { orderService } from '@/services/orderService';
import { getErrorMessage } from '@/services/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatMoney, formatDate } from '@/utils/format';
import { buttonStyles } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductImage } from '@/components/product/ProductImage';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const OrderSuccessPage = () => {
  const { id = '' } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle('Order confirmed');

  useEffect(() => {
    orderService
      .get(id)
      .then(setOrder)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;

  if (!order) {
    return (
      <div className="container-premium py-20">
        <EmptyState
          icon={PackageCheck}
          title="Order not found"
          description={error || 'We could not retrieve this order. It may belong to another account.'}
          action={<Link to="/orders" className={buttonStyles('primary', 'md')}>View my orders</Link>}
        />
      </div>
    );
  }

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      toast.success('Order number copied.');
    } catch {
      toast.error('Could not copy. Please select the number manually.');
    }
  };

  const paymentLabel =
    order.paymentMethod === 'cod'
      ? 'Cash on delivery'
      : order.paymentProvider === 'sandbox'
        ? 'Card · test mode'
        : 'Card · Stripe';

  return (
    <div className="container-premium pb-12 pt-10 sm:pt-16">
      <div className="relative mx-auto max-w-3xl text-center">
        <div className="pointer-events-none absolute inset-x-0 -top-16 mx-auto h-[340px] max-w-[640px] rounded-full bg-[radial-gradient(ellipse,rgba(199,161,122,0.16),transparent_68%)] blur-2xl" />
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-accent"
        >
          <Check className="h-7 w-7" strokeWidth={1.8} />
          <motion.span
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 1.6, repeat: 2 }}
            className="absolute inset-0 rounded-full border border-accent/25"
          />
        </motion.span>
        <p className="eyebrow mt-8">Order received</p>
        <h1 className="mt-3 text-[40px] leading-[1.02] tracking-[-0.05em] text-pearl sm:text-[58px]">
          {order.paymentStatus === 'paid' ? 'Consider it done.' : 'Your order is reserved.'}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-[13px] leading-relaxed text-white/40">
          {order.paymentMethod === 'cod'
            ? 'Your order is confirmed and being prepared. Payment will be collected in cash when it arrives.'
            : 'Payment verified and your pieces are being prepared with care. You can follow every stage from your order page.'}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={copyNumber}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-[11px] text-white/55 transition hover:border-white/20 hover:text-white"
          >
            {order.orderNumber} <Clipboard className="h-3 w-3" />
          </button>
          <StatusBadge status={order.orderStatus} />
          <span className="text-[10px] text-white/25">Placed {formatDate(order.createdAt)}</span>
        </div>

        {order.paymentStatus !== 'paid' && order.paymentMethod === 'card' && (
          <div className="mx-auto mt-5 max-w-lg rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] px-4 py-3 text-[11px] text-amber-100/75">
            Payment is pending. If you did not complete card verification, you can cancel this order from its tracking
            page to release your reserved pieces.
          </div>
        )}
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
        {[
          {
            icon: MapPin,
            title: 'Delivery',
            value: `${order.shippingAddress.fullName}`,
            detail: `${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`,
          },
          {
            icon: CreditCard,
            title: 'Payment',
            value: paymentLabel,
            detail: order.paymentMethod === 'cod' ? `${formatMoney(order.totalAmount)} due on delivery` : `${formatMoney(order.totalAmount)} verified`,
          },
          {
            icon: ShieldCheck,
            title: 'Protected',
            value: 'AURELIS Care',
            detail: 'Two-year warranty · 30-day returns',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-[20px] border border-white/[0.07] bg-white/[0.022] p-5">
            <item.icon className="h-4 w-4 text-accent/60" strokeWidth={1.5} />
            <p className="mt-4 text-[9px] uppercase tracking-[0.16em] text-white/25">{item.title}</p>
            <p className="mt-1.5 text-[12px] text-white/70">{item.value}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-white/30">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-6 max-w-4xl overflow-hidden rounded-[24px] border border-white/[0.07] bg-white/[0.022]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-[14px] text-pearl">Your pieces</h2>
          <Link to={`/orders/${order._id}`} className="text-[10px] text-accent-light transition hover:text-accent">
            Track this order
          </Link>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {order.items.map((item, index) => (
            <div key={`${item.product}-${index}`} className="flex items-center gap-4 px-5 py-4">
              <div className="h-[64px] w-[54px] shrink-0 overflow-hidden rounded-xl product-well">
                <ProductImage src={item.image} alt={item.name} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] text-white/70">{item.name}</p>
                <p className="mt-1 text-[10px] text-white/30">
                  {[item.color, item.size].filter(Boolean).join(' · ') || 'Standard'} · Qty {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-[11px] tabular-nums text-white/50">{formatMoney(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-4">
          <span className="text-[11px] text-white/30">Total</span>
          <span className="text-[18px] tabular-nums text-pearl">{formatMoney(order.totalAmount)}</span>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-4xl rounded-[24px] border border-white/[0.06] bg-white/[0.015] p-6 sm:p-8">
        <p className="eyebrow mb-4">What happens next</p>
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { step: '01', title: 'Confirmed', copy: 'We have received your order and reserved each piece.', done: true },
            { step: '02', title: 'Prepared', copy: 'Your pieces are inspected, cleaned and packed by hand.', done: false },
            { step: '03', title: 'Delivered', copy: 'Follow the live timeline from your orders page.', done: false },
          ].map((entry) => (
            <div key={entry.step} className="flex gap-3">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[9px] ${entry.done ? 'border-accent/40 bg-accent/10 text-accent' : 'border-white/10 text-white/25'}`}>
                {entry.done ? <Check className="h-3 w-3" /> : entry.step}
              </span>
              <div>
                <p className="text-[11px] text-white/65">{entry.title}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-white/25">{entry.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-4xl flex-wrap items-center justify-center gap-3">
        <Link to={`/orders/${order._id}`} className={buttonStyles('primary', 'md')}>
          Track order <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link to="/shop" className={buttonStyles('outline', 'md')}>
          <ShoppingBag className="h-3.5 w-3.5" /> Continue shopping
        </Link>
        <Link to="/contact" className={buttonStyles('ghost', 'md')}>
          Questions? Contact us
        </Link>
      </div>

      <div className="mt-10 flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.2em] text-white/15">
        <Sparkles className="h-3 w-3" /> Thank you for choosing AURELIS
      </div>
    </div>
  );
};
