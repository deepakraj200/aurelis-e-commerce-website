import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  ChevronDown,
  CreditCard,
  MapPin,
  Package,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldAlert,
  UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order } from '@/types';
import { adminService } from '@/services/adminService';
import { getErrorMessage } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/utils/cn';
import { formatDate, formatDateTime, formatMoney } from '@/utils/format';
import { STATUS_LABELS } from '@/utils/constants';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProductImage } from '@/components/product/ProductImage';
import { Badge } from '@/components/ui/Badge';

interface AdminOrder extends Omit<Order, 'user'> {
  user: { _id: string; name: string; email: string; phone?: string } | null;
}

const transitions: Record<string, string[]> = {
  pending_payment: ['cancelled'],
  placed: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const statusOptions = ['all', 'pending_payment', 'placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

export const AdminOrdersPage = () => {
  useDocumentTitle('Order management');
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const debouncedQ = useDebounce(q, 350);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [nextStatus, setNextStatus] = useState('');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminService.orders({
        q: debouncedQ || undefined,
        status: status === 'all' ? undefined : status,
        page,
        limit: 10,
      });
      setOrders(result.data as AdminOrder[]);
      setMeta(result.meta);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    setNextStatus('');
    setNote('');
    try {
      const order = (await adminService.order(id)) as AdminOrder;
      setDetail(order);
      const allowed = transitions[order.orderStatus] || [];
      setNextStatus(allowed[0] || '');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (!detailId) return;
    const order = (await adminService.order(detailId)) as AdminOrder;
    setDetail(order);
    setNextStatus((transitions[order.orderStatus] || [])[0] || '');
  };

  const updateStatus = async () => {
    if (!detail || !nextStatus) return;
    setUpdating(true);
    try {
      await adminService.updateOrderStatus(detail._id, nextStatus, note.trim() || undefined);
      toast.success(`Order moved to ${STATUS_LABELS[nextStatus] || nextStatus}.`);
      setNote('');
      await Promise.all([refreshDetail(), load()]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  const cancelOrder = async () => {
    if (!detail) return;
    setCancelling(true);
    try {
      await adminService.cancelOrder(detail._id, cancelReason.trim() || undefined);
      toast.success('Order cancelled, stock restored and refund issued where applicable.');
      setCancelOpen(false);
      setCancelReason('');
      await Promise.all([refreshDetail(), load()]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const refundOrder = async () => {
    if (!detail) return;
    setRefunding(true);
    try {
      await adminService.refundOrder(detail._id);
      toast.success('Refund processed through the payment provider.');
      setRefundOpen(false);
      await Promise.all([refreshDetail(), load()]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRefunding(false);
    }
  };

  const allowed = detail ? transitions[detail.orderStatus] || [] : [];
  const canCancel = Boolean(detail && !['cancelled', 'delivered'].includes(detail.orderStatus));
  const canRefund = detail?.paymentStatus === 'paid';

  return (
    <div>
      <AdminHeader
        eyebrow="Fulfilment"
        title="Order management."
        description="Follow every order, update its journey and resolve refunds with a full audit trail."
        actions={
          <span className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-3.5 py-2 text-[10px] text-white/30">
            <Package className="h-3 w-3" /> {meta.total} orders
          </span>
        }
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
          <input
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
            placeholder="Order number or customer"
            aria-label="Search orders"
            className="h-10 w-full rounded-full border border-white/[0.08] bg-white/[0.035] pl-9 pr-4 text-[11px] text-white/65 placeholder:text-white/25 focus:border-accent/35"
          />
        </div>
        <div className="relative">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            aria-label="Filter orders by status"
            className="h-10 appearance-none rounded-full border border-white/[0.08] bg-white/[0.035] pl-4 pr-9 text-[10px] text-white/50"
          >
            {statusOptions.map((entry) => (
              <option key={entry} value={entry} className="bg-graphite">
                {entry === 'all' ? 'All statuses' : STATUS_LABELS[entry] || entry}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-white/25" />
        </div>
      </div>

      {error ? (
        <div className="mt-6">
          <EmptyState icon={RefreshCcw} title="Orders could not load" description={error} action={<Button onClick={() => void load()}>Try again</Button>} />
        </div>
      ) : loading ? (
        <div className="mt-5 space-y-2">
          {[1, 2, 3, 4, 5].map((entry) => <Skeleton key={entry} className="h-[66px] rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Package} title="No orders match" description="Try another search or status filter. New orders will appear here immediately." />
        </div>
      ) : (
        <>
          <div className="mt-5 overflow-x-auto rounded-[20px] border border-white/[0.07] bg-white/[0.02]">
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-[8px] uppercase tracking-[0.16em] text-white/20">
                  <th className="px-5 py-3.5 font-medium">Order</th>
                  <th className="px-3 py-3.5 font-medium">Customer</th>
                  <th className="px-3 py-3.5 font-medium">Placed</th>
                  <th className="px-3 py-3.5 font-medium">Items</th>
                  <th className="px-3 py-3.5 font-medium">Payment</th>
                  <th className="px-3 py-3.5 text-right font-medium">Total</th>
                  <th className="px-3 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 text-right font-medium">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.045]">
                {orders.map((order) => (
                  <tr key={order._id} className="group transition hover:bg-white/[0.025]">
                    <td className="px-5 py-3.5">
                      <button type="button" onClick={() => void openDetail(order._id)} className="text-left">
                        <p className="text-[10px] text-white/65 group-hover:text-white">{order.orderNumber}</p>
                        <p className="mt-0.5 text-[8px] uppercase tracking-[0.12em] text-white/20">{order.paymentMethod === 'cod' ? 'COD' : 'Card'}</p>
                      </button>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="max-w-[160px] truncate text-[10px] text-white/50">{order.user?.name || 'Deleted customer'}</p>
                      <p className="mt-0.5 max-w-[160px] truncate text-[9px] text-white/25">{order.user?.email || ''}</p>
                    </td>
                    <td className="px-3 py-3.5 text-[9px] text-white/30">{formatDate(order.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-3 py-3.5 text-[9px] tabular-nums text-white/35">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                    <td className="px-3 py-3.5"><StatusBadge status={order.paymentStatus} /></td>
                    <td className="px-3 py-3.5 text-right text-[10px] tabular-nums text-white/55">{formatMoney(order.totalAmount, 'USD', false)}</td>
                    <td className="px-3 py-3.5"><StatusBadge status={order.orderStatus} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => void openDetail(order._id)}
                        className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.1em] text-white/30 transition hover:text-accent"
                      >
                        Open <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-white/20">Showing {orders.length} of {meta.total}</p>
            <Pagination page={meta.page} pages={meta.pages} onChange={setPage} />
          </div>
        </>
      )}

      <Modal
        open={Boolean(detailId)}
        onClose={() => {
          setDetailId(null);
          setDetail(null);
        }}
        title={detail ? `Order ${detail.orderNumber}` : 'Order detail'}
        description={detail ? `${formatDateTime(detail.createdAt)} · ${formatMoney(detail.totalAmount)}` : undefined}
        size="xl"
      >
        {detailLoading || !detail ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusBadge status={detail.orderStatus} />
              <StatusBadge status={detail.paymentStatus} />
              <Badge>{detail.paymentMethod === 'cod' ? 'Cash on delivery' : detail.paymentProvider === 'stripe' ? 'Stripe' : 'Card · sandbox'}</Badge>
              {detail.trackingHistory[0] && (
                <span className="ml-auto text-[9px] text-white/25">Last update {formatDateTime(detail.trackingHistory[detail.trackingHistory.length - 1].at)}</span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="flex items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-white/25"><UserRound className="h-3 w-3" /> Customer</p>
                <p className="mt-2.5 text-[12px] text-white/65">{detail.user?.name || 'Deleted customer'}</p>
                <p className="mt-0.5 text-[10px] text-white/35">{detail.user?.email}</p>
                {detail.user?.phone && <p className="mt-1 text-[10px] text-white/25">{detail.user.phone}</p>}
                {detail.user?.email && (
                  <Link to={`/admin/customers?q=${encodeURIComponent(detail.user.email)}`} className="mt-3 inline-flex items-center gap-1 text-[9px] text-accent-light/80 hover:text-accent">
                    View customer <ArrowUpRight className="h-2.5 w-2.5" />
                  </Link>
                )}
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="flex items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-white/25"><MapPin className="h-3 w-3" /> Ship to</p>
                <p className="mt-2.5 text-[11px] text-white/60">{detail.shippingAddress.fullName}</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-white/30">
                  {detail.shippingAddress.line1}{detail.shippingAddress.line2 ? `, ${detail.shippingAddress.line2}` : ''}<br />
                  {detail.shippingAddress.city}, {detail.shippingAddress.state} {detail.shippingAddress.postalCode}<br />
                  {detail.shippingAddress.country} · {detail.shippingAddress.phone}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/25">Items</p>
                <p className="text-[9px] text-white/25">{detail.items.reduce((sum, item) => sum + item.quantity, 0)} pieces</p>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {detail.items.map((item, index) => (
                  <div key={`${item.product}-${index}`} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-10 w-9 shrink-0 overflow-hidden rounded-lg product-well">
                      <ProductImage src={item.image} alt={item.name} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] text-white/60">{item.name}</p>
                      <p className="mt-0.5 text-[9px] text-white/25">{[item.color, item.size].filter(Boolean).join(' · ') || 'Standard'} · Qty {item.quantity}</p>
                    </div>
                    <p className="text-[10px] tabular-nums text-white/45">{formatMoney(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 border-t border-white/[0.05] px-4 py-3 text-[10px]">
                <div className="flex justify-between text-white/30"><span>Subtotal</span><span className="tabular-nums">{formatMoney(detail.subtotal)}</span></div>
                <div className="flex justify-between text-white/30"><span>Shipping</span><span className="tabular-nums">{formatMoney(detail.shippingCost)}</span></div>
                <div className="flex justify-between text-white/30"><span>Tax</span><span className="tabular-nums">{formatMoney(detail.tax)}</span></div>
                <div className="flex justify-between border-t border-white/[0.05] pt-2 text-[11px] text-white/65"><span>Total</span><span className="tabular-nums">{formatMoney(detail.totalAmount)}</span></div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="text-[9px] uppercase tracking-[0.16em] text-white/25">Update status</p>
                {allowed.length === 0 ? (
                  <p className="mt-3 text-[10px] leading-relaxed text-white/25">
                    {detail.orderStatus === 'cancelled' ? 'This order is cancelled and closed.' : 'This order has been delivered. The journey is complete.'}
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    <select
                      value={nextStatus}
                      onChange={(event) => setNextStatus(event.target.value)}
                      aria-label="Next status"
                      className="field h-10 appearance-none text-[11px]"
                    >
                      {allowed.map((entry) => (
                        <option key={entry} value={entry} className="bg-graphite">{STATUS_LABELS[entry] || entry}</option>
                      ))}
                    </select>
                    <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={240} placeholder="Optional note for tracking" className="field h-10 text-[11px]" />
                    <Button size="sm" onClick={updateStatus} loading={updating} disabled={!nextStatus}>
                      Update order
                    </Button>
                  </div>
                )}
                {canCancel && (
                  <button type="button" onClick={() => setCancelOpen(true)} className="mt-4 inline-flex items-center gap-1.5 text-[10px] text-white/30 transition hover:text-red-200">
                    <ShieldAlert className="h-3 w-3" /> Cancel order & restock
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="text-[9px] uppercase tracking-[0.16em] text-white/25">Payment</p>
                <div className="mt-2 flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 text-white/30" />
                  <p className="text-[11px] text-white/55">
                    {detail.paymentMethod === 'cod' ? 'Cash on delivery' : detail.paymentProvider === 'stripe' ? 'Stripe card' : 'Sandbox card'}
                  </p>
                </div>
                <p className="mt-1 text-[10px] text-white/25">
                  {detail.paidAt ? `Paid ${formatDateTime(detail.paidAt)}` : detail.paymentStatus === 'pending' ? 'Awaiting payment' : STATUS_LABELS[detail.paymentStatus]}
                </p>
                {canRefund ? (
                  <button type="button" onClick={() => setRefundOpen(true)} className="mt-4 inline-flex items-center gap-1.5 text-[10px] text-accent-light/80 transition hover:text-accent">
                    <RotateCcw className="h-3 w-3" /> Issue refund
                  </button>
                ) : (
                  <p className="mt-4 text-[9px] text-white/20">No refund available for this payment state.</p>
                )}
                {detail.cancelReason && (
                  <p className="mt-3 border-t border-white/[0.05] pt-3 text-[9px] leading-relaxed text-white/30">Cancellation: {detail.cancelReason}</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="text-[9px] uppercase tracking-[0.16em] text-white/25">Tracking history</p>
              <div className="relative mt-4 space-y-4">
                {detail.trackingHistory.length > 0 && <span className="absolute bottom-2 left-[5px] top-2 w-px bg-white/[0.07]" />}
                {[...detail.trackingHistory].reverse().map((event, index) => (
                  <div key={`${event.status}-${event.at}-${index}`} className="relative flex gap-3">
                    <span className={cn('relative z-10 mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2', index === 0 ? 'border-accent bg-[#15120e]' : 'border-white/15 bg-[#0c0c0e]')} />
                    <div>
                      <p className={cn('text-[10px]', index === 0 ? 'text-white/70' : 'text-white/40')}>{event.label}</p>
                      {event.note && <p className="mt-0.5 text-[9px] text-white/25">{event.note}</p>}
                      <p className="mt-1 text-[8px] uppercase tracking-[0.1em] text-white/15">{formatDateTime(event.at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => {
          setCancelOpen(false);
          setCancelReason('');
        }}
        onConfirm={cancelOrder}
        loading={cancelling}
        title="Cancel this order?"
        description="Reserved stock is restored and a refund is issued automatically for paid orders. The cancellation is recorded in the tracking history."
        confirmLabel="Cancel order"
        danger
      >
        <label htmlFor="admin-cancel-reason" className="field-label">Internal reason (optional)</label>
        <textarea
          id="admin-cancel-reason"
          rows={3}
          maxLength={240}
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          className="field resize-none"
          placeholder="Recorded with the order for the audit trail."
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        onConfirm={refundOrder}
        loading={refunding}
        title="Issue a refund?"
        description="The full order amount will be refunded to the original payment method. This action cannot be undone. Stock is not automatically restocked unless the order is cancelled."
        confirmLabel="Issue refund"
        danger
      />
    </div>
  );
};
