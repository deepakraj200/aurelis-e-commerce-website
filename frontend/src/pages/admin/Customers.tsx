import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Ban,
  CheckCircle2,
  ChevronDown,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdminCustomer, Order } from '@/types';
import { adminService } from '@/services/adminService';
import { getErrorMessage } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatMoney, initials } from '@/utils/format';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface CustomerDetail {
  user: AdminCustomer;
  orders: Order[];
  stats: { orderCount: number; spent: number };
}

export const AdminCustomersPage = () => {
  useDocumentTitle('Customer management');
  const currentUser = useAuthStore((state) => state.user);
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const debouncedQ = useDebounce(q, 350);
  const [role, setRole] = useState(searchParams.get('role') || 'all');
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: 'status' | 'role'; next: boolean | 'user' | 'admin' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminService.customers({
        q: debouncedQ || undefined,
        role: role === 'all' ? undefined : role,
        page,
        limit: 10,
      });
      setCustomers(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, role, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const result = (await adminService.customer(id)) as CustomerDetail;
      setDetail(result);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (!detailId) return;
    setDetail((await adminService.customer(detailId)) as CustomerDetail);
  };

  const updateCustomer = async (payload: { isActive?: boolean; role?: 'user' | 'admin' }) => {
    if (!detail) return;
    setSaving(true);
    try {
      await adminService.updateCustomer(detail.user._id, payload);
      toast.success(
        payload.isActive === false
          ? 'Account suspended. Active sessions were revoked.'
          : payload.isActive === true
            ? 'Account restored.'
            : payload.role === 'admin'
              ? 'Administrator access granted.'
              : 'Administrator access removed.'
      );
      setConfirm(null);
      await Promise.all([refreshDetail(), load()]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminHeader
        eyebrow="Relationships"
        title="Customer management."
        description="A complete view of the people behind every order, their history and their account access."
        actions={
          <span className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-3.5 py-2 text-[10px] text-white/30">
            <Users className="h-3 w-3" /> {meta.total} accounts
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
            placeholder="Name or email address"
            aria-label="Search customers"
            className="h-10 w-full rounded-full border border-white/[0.08] bg-white/[0.035] pl-9 pr-4 text-[11px] text-white/65 placeholder:text-white/25 focus:border-accent/35"
          />
        </div>
        <div className="relative">
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
            aria-label="Filter customers by role"
            className="h-10 appearance-none rounded-full border border-white/[0.08] bg-white/[0.035] pl-4 pr-9 text-[10px] text-white/50"
          >
            <option value="all" className="bg-graphite">All accounts</option>
            <option value="user" className="bg-graphite">Customers</option>
            <option value="admin" className="bg-graphite">Administrators</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-white/25" />
        </div>
      </div>

      {error ? (
        <div className="mt-6">
          <EmptyState icon={RefreshCcw} title="Customers could not load" description={error} action={<Button onClick={() => void load()}>Try again</Button>} />
        </div>
      ) : loading ? (
        <div className="mt-5 space-y-2">
          {[1, 2, 3, 4, 5].map((entry) => <Skeleton key={entry} className="h-[66px] rounded-2xl" />)}
        </div>
      ) : customers.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Users} title="No customers found" description="Try another search. New registrations appear here as soon as they create an account." />
        </div>
      ) : (
        <>
          <div className="mt-5 overflow-x-auto rounded-[20px] border border-white/[0.07] bg-white/[0.02]">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-[8px] uppercase tracking-[0.16em] text-white/20">
                  <th className="px-5 py-3.5 font-medium">Customer</th>
                  <th className="px-3 py-3.5 font-medium">Joined</th>
                  <th className="px-3 py-3.5 text-right font-medium">Orders</th>
                  <th className="px-3 py-3.5 text-right font-medium">Lifetime value</th>
                  <th className="px-3 py-3.5 font-medium">Last order</th>
                  <th className="px-3 py-3.5 font-medium">Access</th>
                  <th className="px-5 py-3.5 text-right font-medium">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.045]">
                {customers.map((customer) => (
                  <tr key={customer._id} className="group transition hover:bg-white/[0.025]">
                    <td className="px-5 py-3.5">
                      <button type="button" onClick={() => void openDetail(customer._id)} className="flex items-center gap-3 text-left">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[9px] font-medium text-white/50">
                          {initials(customer.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-[170px] truncate text-[10px] text-white/65 group-hover:text-white">{customer.name}</span>
                          <span className="mt-0.5 block max-w-[170px] truncate text-[9px] text-white/25">{customer.email}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3.5 text-[9px] text-white/30">{formatDate(customer.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-3 py-3.5 text-right text-[10px] tabular-nums text-white/40">{customer.orderCount}</td>
                    <td className="px-3 py-3.5 text-right text-[10px] tabular-nums text-white/50">{formatMoney(customer.totalSpent, 'USD', false)}</td>
                    <td className="px-3 py-3.5 text-[9px] text-white/30">{customer.lastOrderAt ? formatDate(customer.lastOrderAt, { month: 'short', day: 'numeric' }) : '—'}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {customer.role === 'admin' ? <Badge tone="accent">Admin</Badge> : <Badge>Customer</Badge>}
                        {!customer.isActive && <Badge tone="danger">Suspended</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => void openDetail(customer._id)}
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
            <p className="text-[9px] uppercase tracking-[0.14em] text-white/20">Showing {customers.length} of {meta.total}</p>
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
        title={detail?.user.name || 'Customer profile'}
        description={detail?.user.email}
        size="lg"
      >
        {detailLoading || !detail ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[12px] font-medium text-white/60">
                {initials(detail.user.name)}
              </span>
              <div>
                <p className="text-[13px] text-white/70">{detail.user.name}</p>
                <p className="mt-0.5 text-[10px] text-white/30">{detail.user.phone || 'No phone provided'} · Joined {formatDate(detail.user.createdAt)}</p>
              </div>
              <div className="ml-auto flex flex-wrap gap-1.5">
                {detail.user.role === 'admin' ? <Badge tone="accent">Administrator</Badge> : <Badge>Customer</Badge>}
                {detail.user.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Suspended</Badge>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5">
                <p className="text-[8px] uppercase tracking-[0.14em] text-white/20">Orders</p>
                <p className="mt-1.5 text-[18px] font-light tabular-nums text-white/70">{detail.stats.orderCount}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5">
                <p className="text-[8px] uppercase tracking-[0.14em] text-white/20">Paid lifetime</p>
                <p className="mt-1.5 text-[18px] font-light tabular-nums text-white/70">{formatMoney(detail.stats.spent, 'USD', false)}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5">
                <p className="text-[8px] uppercase tracking-[0.14em] text-white/20">Addresses</p>
                <p className="mt-1.5 text-[18px] font-light tabular-nums text-white/70">{detail.user.addresses?.length || 0}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
                <p className="flex items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-white/25"><ShoppingBag className="h-3 w-3" /> Recent orders</p>
                <Link to={`/admin/orders?q=${encodeURIComponent(detail.user.email)}`} className="text-[9px] text-accent-light/70 hover:text-accent">View all orders</Link>
              </div>
              {detail.orders.length === 0 ? (
                <p className="px-4 py-8 text-center text-[10px] text-white/25">This customer has not placed an order yet.</p>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {detail.orders.map((order) => (
                    <div key={order._id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-white/55">{order.orderNumber}</p>
                        <p className="mt-0.5 text-[9px] text-white/25">{formatDate(order.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} items</p>
                      </div>
                      <StatusBadge status={order.orderStatus} />
                      <p className="w-20 text-right text-[10px] tabular-nums text-white/45">{formatMoney(order.totalAmount, 'USD', false)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[10px] text-white/50"><ShieldCheck className="h-3 w-3" /> Account access</p>
                <p className="mt-1 text-[9px] leading-relaxed text-white/25">
                  {detail.user.role === 'admin' ? 'This account can manage the full studio.' : 'This account has customer-level access only.'}
                </p>
              </div>
              {detail.user._id === currentUser?._id ? (
                <p className="text-[9px] text-white/25">You are signed in with this account.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirm({ kind: 'role', next: detail.user.role === 'admin' ? 'user' : 'admin' })}
                    disabled={saving}
                  >
                    {detail.user.role === 'admin' ? <UserRound className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    {detail.user.role === 'admin' ? 'Remove admin' : 'Grant admin'}
                  </Button>
                  <Button
                    size="sm"
                    variant={detail.user.isActive ? 'danger' : 'secondary'}
                    onClick={() => setConfirm({ kind: 'status', next: !detail.user.isActive })}
                    disabled={saving}
                  >
                    {detail.user.isActive ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    {detail.user.isActive ? 'Suspend account' : 'Restore account'}
                  </Button>
                </div>
              )}
            </div>

            {detail.user.addresses?.length > 0 && (
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="text-[9px] uppercase tracking-[0.16em] text-white/25">Saved addresses</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {detail.user.addresses.map((address, index) => (
                    <div key={address._id || index} className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                      <p className="text-[10px] text-white/55">{address.label || 'Address'} {address.isDefault ? '· Default' : ''}</p>
                      <p className="mt-1 text-[9px] leading-relaxed text-white/25">{address.line1}, {address.city} {address.postalCode}, {address.country}</p>
                      <p className="mt-1 text-[9px] text-white/20">{address.fullName} · {address.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          void updateCustomer(confirm.kind === 'status' ? { isActive: confirm.next as boolean } : { role: confirm.next as 'user' | 'admin' });
        }}
        loading={saving}
        title={confirm?.kind === 'status' ? (confirm.next ? 'Restore this account?' : 'Suspend this account?') : confirm?.next === 'admin' ? 'Grant administrator access?' : 'Remove administrator access?'}
        description={
          confirm?.kind === 'status'
            ? confirm.next
              ? 'The customer regains access immediately and can sign in again.'
              : 'The customer is signed out of all sessions immediately and cannot sign in until restored. Order history is preserved.'
            : confirm?.next === 'admin'
              ? 'Administrators can manage products, orders, customers and the entire studio. Only grant this to trusted people.'
              : 'The account returns to customer-level access. The change takes effect immediately.'
        }
        confirmLabel={confirm?.kind === 'status' ? (confirm.next ? 'Restore account' : 'Suspend account') : confirm?.next === 'admin' ? 'Grant access' : 'Remove access'}
        danger={confirm?.kind === 'status' ? !confirm.next : confirm?.next !== 'admin'}
      />
    </div>
  );
};
