import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { PageLoader } from '@/components/ui/Skeleton';
import { buttonStyles } from '@/components/ui/Button';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const location = useLocation();

  if (!initialized) return <PageLoader />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return <>{children}</>;
};

export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const location = useLocation();

  if (!initialized) return <PageLoader />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  if (user.role !== 'admin') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6 text-center">
        <div className="glass max-w-md rounded-[28px] p-10">
          <ShieldAlert className="mx-auto mb-5 h-8 w-8 text-accent" strokeWidth={1.4} />
          <h1 className="text-[24px] text-pearl">Members only</h1>
          <p className="mt-3 text-[13px] leading-relaxed text-white/40">
            The AURELIS admin studio is reserved for authorised team members. Your account does not have
            administrator access.
          </p>
          <Link to="/" className={buttonStyles('primary', 'md', 'mt-7')}>
            Return home
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};
