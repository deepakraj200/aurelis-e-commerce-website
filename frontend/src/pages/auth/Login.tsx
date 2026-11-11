import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/services/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { FormField } from '@/components/ui/FormField';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';

export const LoginPage = () => {
  useDocumentTitle('Sign in');
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from || '/';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}.`);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <p className="eyebrow mb-4">The inner circle</p>
      <h1 className="text-[36px] leading-[1.02] tracking-[-0.045em] text-pearl">Welcome back.</h1>
      <p className="mt-3 text-[13px] leading-relaxed text-white/40">
        Sign in to continue where you left off, track an order, or revisit your saved pieces.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <FormField label="Email" htmlFor="login-email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="field pl-11"
            />
          </div>
        </FormField>

        <FormField label="Password" htmlFor="login-password">
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-white/25" />
            <PasswordInput
              id="login-password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              className="pl-11"
            />
          </div>
        </FormField>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-[11px] text-white/35 transition hover:text-white">
            Forgotten your password?
          </Link>
        </div>

        {error && (
          <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-[11px] text-red-200" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={submitting || loading} className="w-full">
          {!submitting && !loading && <ArrowRight className="h-4 w-4" />}
          Sign in
        </Button>
      </form>

      <div className="mt-7 border-t border-white/[0.07] pt-6 text-center">
        <p className="text-[12px] text-white/35">
          New to AURELIS?{' '}
          <Link to="/register" state={{ from }} className="font-medium text-accent-light transition hover:text-accent">
            Create an account
          </Link>
        </p>
      </div>

      <p className="mt-8 text-center text-[9px] uppercase tracking-[0.18em] text-white/20">
        Secure session · Your data stays yours
      </p>
    </div>
  );
};
