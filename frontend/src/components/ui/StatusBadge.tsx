import { Badge } from './Badge';
import { STATUS_LABELS } from '@/utils/constants';

const statusTones: Record<string, 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'dark'> = {
  pending_payment: 'warning',
  placed: 'info',
  confirmed: 'info',
  processing: 'accent',
  shipped: 'accent',
  out_for_delivery: 'accent',
  delivered: 'success',
  cancelled: 'danger',
  paid: 'success',
  pending: 'warning',
  refunded: 'neutral',
  failed: 'danger',
  new: 'info',
  read: 'neutral',
};

export const StatusBadge = ({ status }: { status: string }) => (
  <Badge tone={statusTones[status] || 'neutral'}>{STATUS_LABELS[status] || status.replaceAll('_', ' ')}</Badge>
);
