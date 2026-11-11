import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Boxes,
  CircleDollarSign,
  Clock3,
  Package,
  RefreshCcw,
  ShoppingBag,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { DashboardData } from '@/types';
import { adminService } from '@/services/adminService';
import { getErrorMessage } from '@/services/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/utils/cn';
import { formatDate, formatMoney, resolveImage } from '@/utils/format';
import { STATUS_LABELS } from '@/utils/constants';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button, buttonStyles } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

const statCards: {
  key: 'revenue' | 'totalOrders' | 'totalCustomers' | 'totalProducts';
  label: string;
  icon: LucideIcon;
  accent?: boolean;
}[] = [
  { key: 'revenue', label: 'Total revenue', icon: CircleDollarSign, accent: true },
  { key: 'totalOrders', label: 'Orders', icon: ShoppingBag },
  { key: 'totalCustomers', label: 'Customers', icon: Users },
  { key: 'totalProducts', label: 'Products', icon: Package },
];

export const AdminDashboardPage = () => {
  useDocumentTitle('Admin overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    adminService
      .dashboard()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revenueChange = useMemo(() => {
    if (!data || data.monthlyRevenue.length < 2) return 0;
    const last = data.monthlyRevenue[data.monthlyRevenue.length - 1].revenue;
    const previous = data.monthlyRevenue[data.monthlyRevenue.length - 2].revenue;
    if (!previous) return last ? 100 : 0;
    return Math.round(((last - previous) / previous) * 100);
  }, [data]);

  const statusEntries = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.ordersByStatus)
      .map(([status, count]) => ({ status, count, label: STATUS_LABELS[status] || status }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const stats = data
    ? {
        revenue: formatMoney(data.revenue, 'USD', false),
        totalOrders: data.totalOrders.toLocaleString(),
        totalCustomers: data.totalCustomers.toLocaleString(),
        totalProducts: data.totalProducts.toLocaleString(),
      }
    : null;

  return (
    <div>
      <AdminHeader
        eyebrow="Commerce overview"
        title="Good afternoon."
        description="A quiet view of how AURELIS is moving — revenue, orders and the pieces people return to."
        actions={
          <>
            <span className="hidden items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-3.5 py-2 text-[10px] text-white/30 md:flex">
              <Clock3 className="h-3 w-3" /> {formatDate(new Date())}
            </span>
            <Link to="/" className={buttonStyles('outline', 'sm')}>
              View storefront <ArrowUpRight className="h-3 w-3" />
            </Link>
          </>
        }
      />

      {error ? (
        <div className="mt-8">
          <EmptyState
            icon={RefreshCcw}
            title="Analytics could not load"
            description={error}
            action={<Button onClick={load}>Try again</Button>}
          />
        </div>
      ) : loading || !data || !stats ? (
        <div className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((entry) => <Skeleton key={entry} className="h-[132px] rounded-[22px]" />)}
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <Skeleton className="h-[360px] rounded-[24px]" />
            <Skeleton className="h-[360px] rounded-[24px]" />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              const value = stats[card.key];
              return (
                <div
                  key={card.key}
                  className={cn(
                    'relative overflow-hidden rounded-[22px] border p-5',
                    card.accent
                      ? 'border-accent/20 bg-[linear-gradient(140deg,rgba(199,161,122,0.12),rgba(255,255,255,0.015))]'
                      : 'border-white/[0.07] bg-white/[0.022]'
                  )}
                >
                  {card.accent && (
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
                  )}
                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/30">{card.label}</p>
                      <p className="mt-3 text-[27px] font-medium tracking-[-0.04em] tabular-nums text-pearl sm:text-[30px]">
                        {value}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl border',
                        card.accent
                          ? 'border-accent/25 bg-accent/10 text-accent-light'
                          : 'border-white/10 bg-white/[0.03] text-white/40'
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                    </span>
                  </div>
                  <div className="relative mt-4 flex items-center gap-2 text-[9px]">
                    {card.key === 'revenue' ? (
                      <span className={cn('flex items-center gap-1', revenueChange >= 0 ? 'text-emerald-300/70' : 'text-red-300/70')}>
                        <TrendingUp className={cn('h-3 w-3', revenueChange < 0 && 'rotate-180')} />
                        {revenueChange >= 0 ? '+' : ''}{revenueChange}% this month
                      </span>
                    ) : card.key === 'totalOrders' ? (
                      <span className="text-white/25">{statusEntries.find((entry) => entry.status === 'processing')?.count || 0} processing now</span>
                    ) : card.key === 'totalCustomers' ? (
                      <span className="text-white/25">+{data.newCustomers} joined in 30 days</span>
                    ) : (
                      <span className="text-white/25">{data.lowStock} low on stock</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.022] p-5 sm:p-6">
              <RevenueChart data={data.monthlyRevenue} />
            </div>

            <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.022]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <div>
                  <p className="text-[12px] font-medium text-white/70">Best sellers</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-white/20">By units sold</p>
                </div>
                <Link to="/admin/products" className="text-[10px] text-white/30 transition hover:text-white">
                  Products <ArrowUpRight className="ml-0.5 inline h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y divide-white/[0.05]">
                {data.bestSellers.length === 0 ? (
                  <p className="px-5 py-8 text-center text-[11px] text-white/25">No sales yet.</p>
                ) : (
                  data.bestSellers.map((product, index) => (
                    <div key={product._id} className="flex items-center gap-3 px-5 py-3.5">
                      <span className="w-4 text-[10px] tabular-nums text-white/20">0{index + 1}</span>
                      <div className="h-10 w-9 shrink-0 overflow-hidden rounded-lg product-well">
                        <img src={resolveImage(product.image)} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] text-white/65">{product.name}</p>
                        <p className="mt-0.5 text-[9px] text-white/25">{product.units} sold</p>
                      </div>
                      <p className="text-[10px] tabular-nums text-white/40">{formatMoney(product.revenue, 'USD', false)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <div className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-white/[0.022]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <div>
                  <p className="text-[12px] font-medium text-white/70">Recent orders</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-white/20">Latest activity</p>
                </div>
                <Link to="/admin/orders" className="flex items-center gap-1 text-[10px] text-white/30 transition hover:text-white">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-white/[0.05] text-[8px] uppercase tracking-[0.16em] text-white/20">
                      <th className="px-5 py-3 font-medium">Order</th>
                      <th className="px-3 py-3 font-medium">Customer</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 text-right font-medium">Total</th>
                      <th className="px-5 py-3 text-right font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {data.recentOrders.map((order) => {
                      const customer = typeof order.user === 'object' ? order.user : null;
                      return (
                        <tr key={order._id} className="transition hover:bg-white/[0.02]">
                          <td className="px-5 py-3.5">
                            <Link to={`/admin/orders?q=${order.orderNumber}`} className="text-[10px] text-white/60 hover:text-white">
                              {order.orderNumber}
                            </Link>
                          </td>
                          <td className="px-3 py-3.5">
                            <p className="max-w-[150px] truncate text-[10px] text-white/50">{customer?.name || 'Guest'}</p>
                          </td>
                          <td className="px-3 py-3.5"><StatusBadge status={order.orderStatus} /></td>
                          <td className="px-3 py-3.5 text-right text-[10px] tabular-nums text-white/50">{formatMoney(order.totalAmount, 'USD', false)}</td>
                          <td className="px-5 py-3.5 text-right text-[9px] text-white/25">{formatDate(order.createdAt, { month: 'short', day: 'numeric' })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.022] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-white/70">Order pipeline</p>
                  <Link to="/admin/orders" className="text-[10px] text-white/30 hover:text-white">Manage</Link>
                </div>
                <div className="mt-4 space-y-2.5">
                  {statusEntries.slice(0, 5).map((entry) => (
                    <div key={entry.status}>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white/40">{entry.label}</span>
                        <span className="tabular-nums text-white/55">{entry.count}</span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className="h-full rounded-full bg-accent/55"
                          style={{ width: `${Math.min(100, (entry.count / Math.max(1, data.totalOrders)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {statusEntries.length === 0 && <p className="py-4 text-[10px] text-white/25">No orders yet.</p>}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.022] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-white/70">At a glance</p>
                  <Boxes className="h-3.5 w-3.5 text-white/25" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[8px] uppercase tracking-[0.14em] text-white/20">Avg. order</p>
                    <p className="mt-1.5 text-[16px] tabular-nums text-white/70">{formatMoney(data.averageOrderValue, 'USD', false)}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[8px] uppercase tracking-[0.14em] text-white/20">Low stock</p>
                    <p className="mt-1.5 text-[16px] tabular-nums text-white/70">{data.lowStock}</p>
                  </div>
                  <div className="col-span-2 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-3.5 w-3.5 text-accent/60" />
                      <span className="text-[10px] text-white/40">Paid orders</span>
                    </div>
                    <span className="text-[10px] tabular-nums text-white/60">
                      {data.totalOrders - (data.ordersByStatus.cancelled || 0)} of {data.totalOrders}
                    </span>
                  </div>
                </div>
                <Link
                  to="/admin/products?status=low"
                  className="mt-4 flex items-center justify-between rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-3 py-2.5 text-[10px] text-amber-100/60 transition hover:bg-amber-400/[0.07]"
                >
                  Review low inventory <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-[20px] border border-white/[0.06] bg-white/[0.015] px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-[10px] leading-relaxed text-white/25">
              Revenue reflects server-verified payments only. Cancelled and refunded orders are excluded.
            </p>
            <Link to="/admin/orders" className={buttonStyles('ghost', 'sm')}>
              Open order management <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
};
