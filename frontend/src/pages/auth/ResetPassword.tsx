import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/authService';
import { getErrorMessage } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { passwordRules, passwordScore } from '@/utils/password';
import { cn } from '@/utils/cn';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { FormField } from '@/components/ui/FormField';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';

export const ResetPasswordPage = () => {
  useDocumentTitle('Choose a new password');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const rules = passwordRules(password);
  const score = passwordScore(password);
  const valid = useMemo(() => rules.every((rule) => rule.met) && password === confirm, [rules, password, confirm]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Your passwords do not match.');
      return;
    }
    if (!rules.every((rule) => rule.met)) {
      setError('Please choose a password that meets all three requirements.');
      return;
    }
    setLoading(true);
    try {
      const user = await authService.resetPassword({ token, password });
      setUser(user);
      toast.success('Your password has been reset. Welcome back.');
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div>
        <p className="eyebrow mb-4">Account recovery</p>
        <h1 className="text-[34px] leading-[1.04] tracking-[-0.04em] text-pearl">This link is incomplete.</h1>
        <p className="mt-4 text-[13px] leading-relaxed text-white/40">
          A valid reset token is required. Request a fresh link and try again.
        </p>
        <Link to="/forgot-password" className="mt-7 inline-flex items-center gap-2 rounded-full bg-pearl px-6 py-3.5 text-[12px] font-semibold text-ink">
          Request a new link <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow mb-4">Account recovery</p>
      <h1 className="text-[34px] leading-[1.04] tracking-[-0.04em] text-pearl">Choose a new password.</h1>
      <p className="mt-3 text-[13px] leading-relaxed text-white/40">
        Choose something considered and difficult to guess. You will be signed in once it is saved.
      </p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        <FormField label="New password" htmlFor="reset-password">
          <PasswordInput
            id="reset-password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
          />
          {password && (
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((entry) => (
                <span
                  key={entry}
                  className={cn(
                    'h-1 flex-1 rounded-full',
                    entry <= score ? (score >= 4 ? 'bg-emerald-400/70' : score >= 3 ? 'bg-accent/70' : 'bg-white/30') : 'bg-white/[0.07]'
                  )}
                />
              ))}
            </div>
          )}
          <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
            {rules.map((rule) => (
              <li key={rule.label} className={cn('flex items-center gap-1 text-[9px]', rule.met ? 'text-emerald-300/70' : 'text-white/25')}>
                <Check className={cn('h-2.5 w-2.5', !rule.met && 'opacity-0')} /> {rule.label}
              </li>
            ))}
          </ul>
        </FormField>

        <FormField label="Confirm new password" htmlFor="reset-confirm">
          <PasswordInput
            id="reset-confirm"
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

        <Button type="submit" size="lg" loading={loading} disabled={!valid} className="w-full">
          {!loading && <ArrowRight className="h-4 w-4" />} Save new password
        </Button>
      </form>

      <p className="mt-6 text-center text-[11px] text-white/30">
        Link expired?{' '}
        <Link to="/forgot-password" className="text-accent-light hover:text-accent">
          Request another
        </Link>
      </p>
    </div>
  );
};
