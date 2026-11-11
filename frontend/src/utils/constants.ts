export const SHIPPING = {
  fee: 12,
  freeThreshold: 150,
  taxRate: 0.08,
};

export const ORDER_STAGES = [
  { status: 'placed', label: 'Order Placed', description: 'We have received your order.' },
  { status: 'confirmed', label: 'Confirmed', description: 'Your order is confirmed by our studio.' },
  { status: 'processing', label: 'Processing', description: 'Your pieces are being prepared.' },
  { status: 'shipped', label: 'Shipped', description: 'Your order has left the atelier.' },
  { status: 'out_for_delivery', label: 'Out for Delivery', description: 'Arriving with our courier today.' },
  { status: 'delivered', label: 'Delivered', description: 'Delivered. We hope you love it.' },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Awaiting Payment',
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  paid: 'Paid',
  refunded: 'Refunded',
};

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

export const NAV_LINKS = [
  { label: 'Shop', to: '/shop' },
  { label: 'Collections', to: '/categories' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export const FALLBACK_CONFIG = {
  brand: 'AURELIS',
  currency: 'USD',
  taxRate: SHIPPING.taxRate,
  shippingFee: SHIPPING.fee,
  freeShippingThreshold: SHIPPING.freeThreshold,
  payments: { stripeEnabled: false, sandbox: true, publishableKey: '' },
  cloudinaryEnabled: false,
};
