import { useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Mail, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/services/api';
import { passwordRules, passwordScore } from '@/utils/password';
import { cn } from '@/utils/cn';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { FormField } from '@/components/ui/FormField';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';

export const RegisterPage = () => {
  useDocumentTitle('Create an account');
  const navigate = useNavigate();
  const location = useLocation();
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from || '/';
  const rules = passwordRules(password);
  const score = passwordScore(password);
  const strength = useMemo(() => ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Exceptional'][score], [score]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Your passwords do not match.');
      return;
    }
    if (rules.some((rule) => !rule.met)) {
      setError('Please choose a password that meets all three requirements.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await register({ name: name.trim(), email: email.trim(), password });
      toast.success(`Welcome to AURELIS, ${user.name.split(' ')[0]}.`);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <p className="eyebrow mb-4">Join AURELIS</p>
      <h1 className="text-[36px] leading-[1.02] tracking-[-0.045em] text-pearl">Create your account.</h1>
      <p className="mt-3 text-[13px] leading-relaxed text-white/40">
        Save your wishlist, follow your orders and receive private releases before anyone else.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <FormField label="Name" htmlFor="register-name">
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              id="register-name"
              required
              minLength={2}
              maxLength={60}
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your full name"
              className="field pl-11"
            />
          </div>
        </FormField>

        <FormField label="Email" htmlFor="register-email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              id="register-email"
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

        <FormField label="Password" htmlFor="register-password">
          <PasswordInput
            id="register-password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
          />
          {password && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.14em]">
                <span className="text-white/25">Password strength</span>
                <span className={cn(score >= 4 ? 'text-emerald-300/80' : score >= 3 ? 'text-amber-200/80' : 'text-white/35')}>
                  {strength}
                </span>
              </div>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((entry) => (
                  <span
                    key={entry}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      entry <= score ? (score >= 4 ? 'bg-emerald-400/70' : score >= 3 ? 'bg-accent/70' : 'bg-white/30') : 'bg-white/[0.07]'
                    )}
                  />
                ))}
              </div>
              <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                {rules.map((rule) => (
                  <li key={rule.label} className={cn('flex items-center gap-1 text-[9px]', rule.met ? 'text-emerald-300/70' : 'text-white/25')}>
                    <Check className={cn('h-2.5 w-2.5', !rule.met && 'opacity-0')} /> {rule.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </FormField>

        <FormField label="Confirm password" htmlFor="register-confirm">
          <PasswordInput
            id="register-confirm"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="Repeat your password"
          />
        </FormField>

        {error && (
          <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-[11px] text-red-200" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={submitting || loading} className="w-full">
          {!submitting && !loading && <ArrowRight className="h-4 w-4" />}
          Create account
        </Button>
      </form>

      <p className="mt-4 text-[10px] leading-relaxed text-white/25">
        By creating an account you agree to our privacy-respecting care. We never sell your data.
      </p>

      <div className="mt-7 border-t border-white/[0.07] pt-6 text-center">
        <p className="text-[12px] text-white/35">
          Already a member?{' '}
          <Link to="/login" state={{ from }} className="font-medium text-accent-light transition hover:text-accent">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
