export type Role = 'user' | 'admin';

export interface Address {
  _id?: string;
  label?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatar?: string;
  addresses: Address[];
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  featured: boolean;
  sortOrder: number;
  productCount?: number;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Specification {
  label: string;
  value: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  shortDescription: string;
  description: string;
  brand: string;
  price: number;
  originalPrice?: number | null;
  category: Category | string;
  images: string[];
  stock: number;
  specifications: Specification[];
  colors: ProductColor[];
  sizes: string[];
  rating: number;
  numReviews: number;
  featured: boolean;
  isActive: boolean;
  tags: string[];
  sold: number;
  discountPercent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  user: { _id: string; name: string; avatar?: string } | string;
  product: string;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface ReviewDistribution {
  [key: string]: number;
}

export interface CartLine {
  _id: string;
  product: Product;
  quantity: number;
  color: string;
  size: string;
  lineTotal: number;
}

export interface CartSummary {
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  count: number;
}

export interface Cart {
  _id?: string;
  items: CartLine[];
  summary: CartSummary;
  updatedAt?: string;
}

export type OrderStatus =
  | 'pending_payment'
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  product: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
  color: string;
  size: string;
}

export interface TrackingEvent {
  status: OrderStatus | string;
  label: string;
  note: string;
  at: string;
}

export interface TimelineStage {
  status: OrderStatus;
  label: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string | { _id: string; name: string; email: string };
  items: OrderItem[];
  shippingAddress: Omit<Address, '_id' | 'label' | 'isDefault'>;
  paymentMethod: 'card' | 'cod';
  paymentProvider: 'stripe' | 'sandbox' | 'none';
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  trackingHistory: TrackingEvent[];
  statusLabel?: string;
  canCancel?: boolean;
  timeline?: TimelineStage[];
  reviewedProductIds?: string[];
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  adminNote?: string;
}

export interface PaginationMeta {
  page: number;
  pages: number;
  total: number;
  limit: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
  details?: { field: string; message: string }[];
}

export interface ApiList<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaymentIntent {
  provider: 'stripe' | 'sandbox';
  clientSecret: string;
  confirmationRef: string;
  publishableKey: string;
  testMode: boolean;
  amount: number;
  currency: string;
  orderNumber: string;
}

export interface RuntimeConfig {
  brand: string;
  currency: string;
  taxRate: number;
  shippingFee: number;
  freeShippingThreshold: number;
  payments: {
    stripeEnabled: boolean;
    sandbox: boolean;
    publishableKey: string;
  };
  cloudinaryEnabled: boolean;
}

export interface ProductListParams {
  q?: string;
  category?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  rating?: number | string;
  featured?: boolean | string;
  inStock?: boolean | string;
  onSale?: boolean | string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface DashboardData {
  revenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  newCustomers: number;
  lowStock: number;
  averageOrderValue: number;
  monthlyRevenue: { month: string; label: string; revenue: number; orders: number }[];
  recentOrders: Order[];
  bestSellers: { _id: string; name: string; image: string; revenue: number; units: number }[];
  ordersByStatus: Record<string, number>;
}

export interface AdminCustomer extends User {
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}
