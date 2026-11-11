import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Package, RefreshCcw, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order } from '@/types';
import { orderService } from '@/services/orderService';
import { getErrorMessage } from '@/services/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate, formatMoney } from '@/utils/format';
import { cn } from '@/utils/cn';
import { PageIntro } from '@/components/ui/PageIntro';
import { Button, buttonStyles } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProductImage } from '@/components/product/ProductImage';
import { Skeleton } from '@/components/ui/Skeleton';

const filters = [
  { value: 'all', label: 'All orders' },
  { value: 'active', label: 'In progress' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const OrdersPage = () => {
  useDocumentTitle('My orders');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: 8 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = async (nextFilter = filter, nextPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderService.list({ status: nextFilter, page: nextPage, limit: 8 });
      setOrders(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(filter, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]);

  const changeFilter = (value: string) => {
    setFilter(value);
    setPage(1);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await orderService.cancel(cancelTarget._id, reason.trim() || undefined);
      toast.success('Order cancelled. Your payment has been refunded where applicable.');
      setCancelTarget(null);
      setReason('');
      await load(filter, page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="container-premium pb-10 pt-10 sm:pt-14">
      <PageIntro
        eyebrow="Your history"
        title="Orders & deliveries."
        description="Follow every piece from our studio to your door. Cancel eligible orders and revisit the details of past purchases."
        actions={<Link to="/shop" className={buttonStyles('outline', 'md')}>Continue shopping <ArrowRight className="h-3.5 w-3.5" /></Link>}
      />

      <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-4">
        {filters.map((entry) => (
          <button
            key={entry.value}
            type="button"
            onClick={() => changeFilter(entry.value)}
            className={cn(
              'rounded-full border px-4 py-2 text-[11px] transition',
              filter === entry.value
                ? 'border-pearl bg-pearl text-ink'
                : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white'
            )}
          >
            {entry.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] uppercase tracking-[0.16em] text-white/20">
          {meta.total} order{meta.total === 1 ? '' : 's'}
        </span>
      </div>

      <div className="mt-6">
        {error ? (
          <EmptyState
            icon={RefreshCcw}
            title="Orders could not load"
            description={error}
            action={<Button onClick={() => void load()}>Try again</Button>}
          />
        ) : loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((entry) => <Skeleton key={entry} className="h-[190px] w-full rounded-[24px]" />)}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={filter === 'all' ? ShoppingBag : Package}
            title={filter === 'all' ? 'No orders yet' : `No ${filters.find((item) => item.value === filter)?.label.toLowerCase()}`}
            description={
              filter === 'all'
                ? 'When you place your first order, it will appear here with a live tracking timeline.'
                : 'Try another filter, or continue exploring the collection.'
            }
            action={<Link to="/shop" className={buttonStyles('primary', 'md')}>Explore the shop</Link>}
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article
                key={order._id}
                className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-white/[0.022] transition hover:border-white/[0.13]"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.16em] text-white/25">Order</p>
                      <p className="mt-0.5 text-[12px] font-medium text-white/75">{order.orderNumber}</p>
                    </div>
                    <div className="hidden h-7 w-px bg-white/[0.08] sm:block" />
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.16em] text-white/25">Placed</p>
                      <p className="mt-0.5 text-[11px] text-white/50">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="hidden h-7 w-px bg-white/[0.08] sm:block" />
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.16em] text-white/25">Payment</p>
                      <p className="mt-0.5 text-[11px] capitalize text-white/50">
                        {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Card'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.orderStatus} />
                    <span className="text-[15px] tabular-nums text-pearl">{formatMoney(order.totalAmount)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div
                          key={`${item.product}-${index}`}
                          className="h-[58px] w-[48px] overflow-hidden rounded-xl border-2 border-[#101012] product-well"
                        >
                          <ProductImage src={item.image} alt={item.name} />
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="flex h-[58px] w-[48px] items-center justify-center rounded-xl border-2 border-[#101012] bg-white/[0.06] text-[10px] text-white/50">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-white/70">
                        {order.items[0]?.name}
                        {order.items.length > 1 ? ` + ${order.items.length - 1} more` : ''}
                      </p>
                      <p className="mt-1 text-[10px] text-white/30">
                        {order.itemCount || order.items.reduce((sum, item) => sum + item.quantity, 0)} pieces · {order.statusLabel || order.orderStatus.replaceAll('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {order.canCancel && (
                      <button
                        type="button"
                        onClick={() => {
                          setCancelTarget(order);
                          setReason('');
                        }}
                        className={buttonStyles('ghost', 'sm', 'text-white/35 hover:text-red-200')}
                      >
                        Cancel
                      </button>
                    )}
                    <Link
                      to={`/orders/${order._id}`}
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 px-4 text-[11px] text-white/55 transition hover:border-white/25 hover:text-white"
                    >
                      View & track <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
            <Pagination page={meta.page} pages={meta.pages} onChange={setPage} className="pt-6" />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => {
          setCancelTarget(null);
          setReason('');
        }}
        onConfirm={confirmCancel}
        loading={cancelling}
        title="Cancel this order?"
        description="Eligible orders can be cancelled before dispatch. Your payment will be refunded automatically to the original method. Stock is released immediately."
        confirmLabel="Cancel order"
        danger
      >
        <label htmlFor="cancel-reason" className="field-label">
          Reason (optional)
        </label>
        <textarea
          id="cancel-reason"
          rows={3}
          maxLength={240}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="field resize-none"
          placeholder="Let us know why — it helps us improve."
        />
      </ConfirmDialog>
    </div>
  );
};
