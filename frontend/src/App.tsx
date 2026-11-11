import { Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ConfigProvider } from '@/context/ConfigContext';
import { AuthBootstrap } from '@/components/common/AuthBootstrap';
import { ProtectedRoute, AdminRoute } from '@/components/common/ProtectedRoute';
import { PageLoader } from '@/components/ui/Skeleton';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

const HomePage = lazy(() => import('@/pages/Home').then((module) => ({ default: module.HomePage })));
const ShopPage = lazy(() => import('@/pages/Shop').then((module) => ({ default: module.ShopPage })));
const ProductDetailsPage = lazy(() => import('@/pages/ProductDetails').then((module) => ({ default: module.ProductDetailsPage })));
const CategoriesPage = lazy(() => import('@/pages/Categories').then((module) => ({ default: module.CategoriesPage })));
const SearchPage = lazy(() => import('@/pages/Search').then((module) => ({ default: module.SearchPage })));
const CartPage = lazy(() => import('@/pages/Cart').then((module) => ({ default: module.CartPage })));
const WishlistPage = lazy(() => import('@/pages/Wishlist').then((module) => ({ default: module.WishlistPage })));
const CheckoutPage = lazy(() => import('@/pages/Checkout').then((module) => ({ default: module.CheckoutPage })));
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccess').then((module) => ({ default: module.OrderSuccessPage })));
const AboutPage = lazy(() => import('@/pages/About').then((module) => ({ default: module.AboutPage })));
const ContactPage = lazy(() => import('@/pages/Contact').then((module) => ({ default: module.ContactPage })));
const ProfilePage = lazy(() => import('@/pages/Profile').then((module) => ({ default: module.ProfilePage })));
const OrdersPage = lazy(() => import('@/pages/Orders').then((module) => ({ default: module.OrdersPage })));
const OrderTrackingPage = lazy(() => import('@/pages/OrderTracking').then((module) => ({ default: module.OrderTrackingPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFound').then((module) => ({ default: module.NotFoundPage })));

const LoginPage = lazy(() => import('@/pages/auth/Login').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/Register').then((module) => ({ default: module.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPassword').then((module) => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPassword').then((module) => ({ default: module.ResetPasswordPage })));

const AdminDashboardPage = lazy(() => import('@/pages/admin/Dashboard').then((module) => ({ default: module.AdminDashboardPage })));
const AdminProductsPage = lazy(() => import('@/pages/admin/Products').then((module) => ({ default: module.AdminProductsPage })));
const AdminOrdersPage = lazy(() => import('@/pages/admin/Orders').then((module) => ({ default: module.AdminOrdersPage })));
const AdminCustomersPage = lazy(() => import('@/pages/admin/Customers').then((module) => ({ default: module.AdminCustomersPage })));

const page = (node: ReactNode) => <Suspense fallback={<PageLoader />}>{node}</Suspense>;
const protectedPage = (node: ReactNode) => <ProtectedRoute>{page(node)}</ProtectedRoute>;

const App = () => (
  <ConfigProvider>
    <BrowserRouter>
      <AuthBootstrap />
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={page(<HomePage />)} />
          <Route path="shop" element={page(<ShopPage />)} />
          <Route path="product/:slug" element={page(<ProductDetailsPage />)} />
          <Route path="categories" element={page(<CategoriesPage />)} />
          <Route path="search" element={page(<SearchPage />)} />
          <Route path="cart" element={page(<CartPage />)} />
          <Route path="wishlist" element={page(<WishlistPage />)} />
          <Route path="checkout" element={protectedPage(<CheckoutPage />)} />
          <Route path="checkout/success/:id" element={protectedPage(<OrderSuccessPage />)} />
          <Route path="about" element={page(<AboutPage />)} />
          <Route path="contact" element={page(<ContactPage />)} />
          <Route path="profile" element={protectedPage(<ProfilePage />)} />
          <Route path="orders" element={protectedPage(<OrdersPage />)} />
          <Route path="orders/:id" element={protectedPage(<OrderTrackingPage />)} />
          <Route path="*" element={page(<NotFoundPage />)} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="login" element={page(<LoginPage />)} />
          <Route path="register" element={page(<RegisterPage />)} />
          <Route path="forgot-password" element={page(<ForgotPasswordPage />)} />
          <Route path="reset-password" element={page(<ResetPasswordPage />)} />
        </Route>

        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={page(<AdminDashboardPage />)} />
          <Route path="products" element={page(<AdminProductsPage />)} />
          <Route path="orders" element={page(<AdminOrdersPage />)} />
          <Route path="customers" element={page(<AdminCustomersPage />)} />
        </Route>
      </Routes>

      <Toaster
        position="bottom-right"
        gutter={10}
        toastOptions={{
          duration: 3800,
          style: {
            background: 'rgba(17, 17, 19, 0.94)',
            color: '#F5F5F7',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '12px 16px',
            fontSize: '12.5px',
            letterSpacing: '-0.01em',
            boxShadow: '0 24px 70px -20px rgba(0,0,0,0.9)',
            backdropFilter: 'blur(24px)',
          },
          success: {
            iconTheme: { primary: '#C7A17A', secondary: '#111113' },
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: '#111113' },
          },
        }}
      />
    </BrowserRouter>
  </ConfigProvider>
);

export default App;
